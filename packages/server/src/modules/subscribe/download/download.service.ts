import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ApplicationLogger } from '../../../common/application.logger.service.js';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { FileService } from '../../file/file.service.js';
import { CronJob } from 'cron';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { DownloadItem } from './download-item.entity.js';
import path from 'node:path';
import { DOWNLOAD_DIR, INDEX_DIR, VALID_VIDEO_MIME } from '../../../constants.js';
import { StatusEnum } from '../../../enums/index.js';
import { generateMD5 } from '../../../utils/generate-md5.util.js';
import { DownloadTask } from './download-task.interface.js';
import fs from 'fs-extra';
import { DownloadItemState } from './download-item-state.interface.js';
import { FeedEntry } from '@extractus/feed-extractor';
import { RuleFileDescriptor } from '../rule/rule.interface.js';
import { Rule } from '../rule/rule.entity.js';
import { Source } from '../source/source.entity.js';
import { ParseLog } from '../parse-log/parse-log.entity.js';
import { RuleErrorLogService } from '../rule/rule-error-log.service.js';
import { MediaService } from '../../media/media.service.js';
import { SeriesService } from '../../media/series/series.service.js';
import { EpisodeService } from '../../media/episode/episode.service.js';
import { MediaFileService } from '../../media/media-file.service.js';
import { SUBSCRIBE_MODULE_OPTIONS_TOKEN } from '../subscribe.module-definition.js';
import { SubscribeModuleOptions } from '../subscribe.module.interface.js';
import { RuleService } from '../rule/rule.service.js';
import { DownloaderAdapter } from './downloader-adapter.interface.js';
import { DOWNLOADER_ADAPTERS } from './adapters/downloader-adapters.js';
import { SourceService } from '../source/source.service.js';
import { instanceToPlain } from 'class-transformer';
import { File } from '../../file/file.entity.js';

@Injectable()
export class DownloadService implements OnModuleInit {
  tasks = new Map<string, DownloadTask>();
  private adapter: DownloaderAdapter;

  private static TRACKER_CACHE_KEY = 'download:trackers';
  private logger = new ApplicationLogger(DownloadService.name);

  constructor(
    @InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>,
    @Inject(SUBSCRIBE_MODULE_OPTIONS_TOKEN) private options: SubscribeModuleOptions,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
    private scheduleRegistry: SchedulerRegistry,
    private fileService: FileService,
    private sourceService: SourceService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private mediaService: MediaService,
    private seriesService: SeriesService,
    private episodeService: EpisodeService,
    private mediaFileService: MediaFileService,
  ) {}

  getOptions() {
    return this.options;
  }

  getFileService() {
    return this.fileService;
  }

  async onModuleInit() {
    await this.downloadItemRepository.update(
      {
        status: In([StatusEnum.PENDING, StatusEnum.PAUSED]),
      },
      {
        status: StatusEnum.FAILED,
        error: 'Application restarted',
      },
    );

    if (this.options.trackerAutoUpdate) {
      const job = CronJob.from({
        cronTime: CronExpression.EVERY_12_HOURS,
        onTick: async () => {
          await this.updateBtTrackers();
        },
        runOnInit: true,
      });
      this.scheduleRegistry.addCronJob('auto-update-trackers', job as any);
    }

    let adapterType = this.options.downloader;
    if (!adapterType || !DOWNLOADER_ADAPTERS[adapterType]) {
      this.logger.error(`Download adapter '${adapterType}' not found, use fallback adapter: webtorrent`);
      adapterType = 'webtorrent';
    }

    try {
      this.adapter = new DOWNLOADER_ADAPTERS[adapterType](this);
      await this.adapter.initialize?.();
      this.logger.log(`Download service is running, adapter: ${adapterType}`);
    } catch (error) {
      this.logger.error(
        `Downloader adapter '${this.options.downloader}' initialize failed`,
        error.stack,
        DownloadService.name,
      );
    }
  }

  private async updateBtTrackers() {
    try {
      const response = await fetch(this.options.trackerUpdateUrl, {
        agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      });
      const rawText = await response.text();
      const tracker = rawText.trim().split(/\s+/g);
      await this.cacheStore.set(DownloadService.TRACKER_CACHE_KEY, tracker);
      this.logger.log('Downloader trackers updated');
    } catch (error) {
      this.logger.error('Downloader update trackers failed', error.stack, DownloadService.name);
    }
  }

  private async getState(task: DownloadTask): Promise<DownloadItemState> {
    return await this.adapter.getState(task);
  }

  async createTask(url: string, props?: DeepPartial<DownloadItem>) {
    const hash = await generateMD5(url);
    const item = await this.save({
      ...props,
      url,
      hash,
      status: StatusEnum.PENDING,
    });

    const trackers = (await this.cacheStore.get<string[]>(DownloadService.TRACKER_CACHE_KEY)) ?? [];
    const dir = path.join(DOWNLOAD_DIR, item.id.replace(/-/g, ''));
    const task = await this.adapter.createTask(item.id, url, dir, trackers);
    this.tasks.set(item.id, task);
    return task;
  }

  async createAutoDownloadTask(
    entry: FeedEntry,
    props: {
      item?: DownloadItem;
      rule?: Partial<Rule>;
      source?: Partial<Source>;
      log?: Partial<ParseLog>;
    } = {},
  ) {
    const task = await this.createTask(entry.enclosure.url, {
      id: props.item?.id,
      name: entry.title,
      hash: await generateMD5(entry.enclosure.url),
      url: entry.enclosure.url,
      source: props.source && { id: props.source.id },
      rule: props.rule && { id: props.rule.id },
      log: props.log && { id: props.log.id },
      entry: JSON.stringify(entry),
      error: null,
    });

    task.once('done', async (files) => {
      const source = props.source && (await this.sourceService.findOneBy({ id: props.source.id }));
      // media files
      const mediaFiles = files.filter((file) => VALID_VIDEO_MIME.includes(file.mimetype));
      for (const mediaFile of mediaFiles) {
        // generate file descriptor
        let descriptor: RuleFileDescriptor = {};
        if (props.rule?.id) {
          try {
            const rule = await this.ruleService.findOneBy({ id: props.rule.id });
            if (rule?.file?.isExist) {
              const { hooks, meta, release } = await this.ruleService.createRuleVm(rule.code);
              descriptor = await hooks?.describe?.(entry, instanceToPlain(mediaFile) as File, {
                source: source && ({ ...instanceToPlain(source), parserMeta: source.parserMeta } as Source),
                rule: { ...instanceToPlain(rule), parserMeta: rule.parserMeta } as Rule,
                entry,
                files: instanceToPlain(mediaFiles) as File[],
                meta,
              });
              release?.();
            }
          } catch (error) {
            await this.ruleErrorLogService.save({
              rule: { id: props.rule.id },
              entry: JSON.stringify(entry),
              error: error.toString(),
            });
          } finally {
            descriptor ??= {};
          }
        }

        // attachment files
        const attachments = files
          .filter((file) => !VALID_VIDEO_MIME.includes(file.mimetype))
          .filter((attachment) => path.dirname(attachment.path) === path.dirname(mediaFile.path));

        // save media
        const { id: mediaId } = await this.mediaService.save({
          name: mediaFile.name,
          isPublic: true,
          ...descriptor.media,
          download: { id: task.id },
          file: { id: mediaFile.id },
          attachments: attachments.map(({ id }) => ({ id })),
        });
        const media = await this.mediaService.findOneBy({ id: mediaId });
        await this.mediaFileService.generateMediaFiles(media);

        // move media files
        if (descriptor.savePath) {
          const localPath = path.join(INDEX_DIR, descriptor.savePath);
          const localDir = path.dirname(localPath);
          if (localPath.startsWith(INDEX_DIR)) {
            await fs.ensureDir(localDir);
            await fs.createLink(media.file.path, localPath);
            for (const attachment of attachments) {
              await fs.createLink(attachment.path, path.join(localDir, attachment.filename));
            }
          }
        }

        // save series
        if (descriptor.series?.name) {
          let series = await this.seriesService.findOneBy({
            name: descriptor.series.name,
            season: descriptor.series.season,
          });
          if (!series) {
            series = await this.seriesService.save({
              name: descriptor.series.name,
              season: descriptor.series.season,
            });
          }

          let episode = await this.episodeService.findOneBy({
            title: descriptor.episode?.title ?? entry.title,
            no: descriptor.episode?.no,
          });
          // duplicated episode
          if (episode) {
            if (descriptor.overwriteEpisode ?? true) {
              await this.episodeService.save({
                id: episode.id,
                title: entry.title,
                ...descriptor.episode,
                pubAt: Date.parse(String(entry.published)) ? new Date(entry.published) : undefined,
                media: { id: media.id },
                series: { id: series.id },
              });
            }
          } else {
            // save episode
            await this.episodeService.save({
              title: entry.title,
              ...descriptor.episode,
              pubAt: Date.parse(String(entry.published)) ? new Date(entry.published) : new Date(),
              media: { id: media.id },
              series: { id: series.id },
            });
          }
        }
      }
    });

    return task;
  }

  async getTask(id: string) {
    return this.tasks.get(id);
  }

  async save(item: DeepPartial<DownloadItem>) {
    return await this.downloadItemRepository.save(item);
  }

  async findOneBy(where: FindOptionsWhere<DownloadItem>) {
    const item = await this.downloadItemRepository.findOneBy(where);
    if (item) {
      const task = await this.getTask(item.id);
      item.state = task && (await this.getState(task));
    }
    return item;
  }

  async findAndCount(options?: FindManyOptions<DownloadItem>) {
    const [result, total] = await this.downloadItemRepository.findAndCount(options);
    for (const item of result) {
      const task = await this.getTask(item.id);
      item.state = task && (await this.getState(task));
    }
    return [result, total] as const;
  }

  async delete(where: FindOptionsWhere<DownloadItem>) {
    const items = await this.downloadItemRepository.find({ where });
    for (const item of items) {
      const task = await this.getTask(item.id);
      await task?.remove();
      await this.downloadItemRepository.delete({ id: item.id });
    }

    return items.length > 0;
  }
}
