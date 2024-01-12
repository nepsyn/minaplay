import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadItem } from './download-item.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { StatusEnum } from '../../enums/status.enum.js';
import { Aria2Service } from '../aria2/aria2.service.js';
import { RuleFileDescriber, RuleFileDescriptor } from './rule.interface.js';
import { VALID_VIDEO_MIME } from '../../constants.js';
import { RuleErrorLogService } from './rule-error-log.service.js';
import { MediaService } from '../media/media.service.js';
import { EpisodeService } from '../series/episode.service.js';
import { MediaFileService } from '../media/media-file.service.js';
import { FeedEntry } from '@extractus/feed-extractor';
import { Rule } from './rule.entity.js';
import { FetchLog } from './fetch-log.entity.js';
import { Source } from './source.entity.js';
import path from 'node:path';
import { SeriesService } from '../series/series.service.js';

@Injectable()
export class DownloadItemService implements OnModuleInit {
  constructor(
    @InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>,
    private aria2Service: Aria2Service,
    private ruleErrorLogService: RuleErrorLogService,
    private mediaService: MediaService,
    private seriesService: SeriesService,
    private episodeService: EpisodeService,
    private mediaFileService: MediaFileService,
  ) {}

  async onModuleInit() {
    await this.delete({
      gid: Not(IsNull()),
      status: In([StatusEnum.PENDING, StatusEnum.PAUSED]),
    });
  }

  async addDownloadItemTask(url: string, props: DeepPartial<DownloadItem> = {}) {
    const task = await this.aria2Service.createTask(url);
    const item = await this.save({
      gid: task.gid,
      status: StatusEnum.PENDING,
      createAt: new Date(),
      ...props,
    });

    task.on('complete', async () => {
      await this.save({
        id: item.id,
        gid: null,
        status: StatusEnum.SUCCESS,
      });
    });
    task.on('error', async (status) => {
      await this.save({
        id: item.id,
        status: StatusEnum.FAILED,
        error: status.errorMessage,
      });
    });

    return [task, item] as const;
  }

  async addAutoDownloadItemTask(
    entry: FeedEntry,
    props: {
      item?: DownloadItem;
      describeFn?: RuleFileDescriber;
      rule?: Rule;
      source?: Partial<Source>;
      log?: Partial<FetchLog>;
    } = {},
  ) {
    const [task, item] = await this.addDownloadItemTask(entry.enclosure.url, {
      id: props.item?.id,
      title: entry.title,
      url: entry.enclosure.url,
      source: props.source && { id: props.source.id },
      rule: props.rule && { id: props.rule.id },
      log: props.log && { id: props.log.id },
      entry: JSON.stringify(entry),
      error: null,
    });
    task.on('complete', async (files) => {
      // media files
      for (const mediaFile of files.filter((file) => VALID_VIDEO_MIME.includes(file.mimetype))) {
        // generate file descriptor
        let descriptor: RuleFileDescriptor;
        try {
          descriptor = await props.describeFn?.(entry, mediaFile);
        } catch (error) {
          if (props.rule && props.describeFn) {
            await this.ruleErrorLogService.save({
              rule: { id: props.rule.id },
              entry: JSON.stringify(entry),
              error: error.toString(),
            });
          }

          continue;
        } finally {
          descriptor ??= {};
        }

        // attachment files
        const attachments = files
          .filter((file) => !VALID_VIDEO_MIME.includes(file.mimetype))
          .filter((attachment) => path.dirname(attachment.path) === path.dirname(mediaFile.path));

        // save media
        const { id } = await this.mediaService.save({
          name: mediaFile.name,
          isPublic: true,
          ...descriptor.media,
          download: { id: item.id },
          file: { id: mediaFile.id },
          attachments: attachments.map(({ id }) => ({ id })),
        });
        const media = await this.mediaService.findOneBy({ id });
        await this.mediaFileService.generateMediaFiles(media);

        // save series
        if (descriptor.episode?.series) {
          let series = await this.seriesService.findOneBy({
            name: descriptor.episode.series,
            season: descriptor.episode.season,
          });
          if (!series) {
            series = await this.seriesService.save({
              name: descriptor.episode.series,
              season: descriptor.episode.season,
            });
          }

          // save episode
          await this.episodeService.save({
            title: entry.title,
            pubAt: Date.parse(String(entry.published)) ? new Date(entry.published) : new Date(),
            ...descriptor.episode,
            media: { id: media.id },
            series: { id: series.id },
          });
        }
      }
    });

    await this.aria2Service.startTask(task);

    return [task, item] as const;
  }

  async save(item: DeepPartial<DownloadItem>) {
    return await this.downloadItemRepository.save(item);
  }

  async findOneBy(where: FindOptionsWhere<DownloadItem>) {
    const item = await this.downloadItemRepository.findOneBy(where);
    if (item?.gid) {
      try {
        item.info = await this.aria2Service.tellStatus(item.gid);
      } catch {}
    }
    return item;
  }

  async findAndCount(options?: FindManyOptions<DownloadItem>) {
    const [result, total] = await this.downloadItemRepository.findAndCount(options);
    for (const item of result) {
      if (item.gid) {
        try {
          item.info = await this.aria2Service.tellStatus(item.gid);
        } catch (error) {}
      }
    }
    return [result, total] as const;
  }

  async delete(where: FindOptionsWhere<DownloadItem>) {
    const items = await this.downloadItemRepository.find({ where });
    for (const item of items) {
      await this.downloadItemRepository.delete({ id: item.id });
      if (item.gid) {
        try {
          await this.aria2Service.removeBy(item.gid);
        } catch {}
      }
    }

    return items.length > 0;
  }
}
