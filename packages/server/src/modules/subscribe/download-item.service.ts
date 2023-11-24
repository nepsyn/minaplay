import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadItem } from './download-item.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { Aria2Service } from '../aria2/aria2.service';
import { RuleFileDescriber, RuleFileDescriptor } from './rule.interface';
import { VALID_VIDEO_MIME } from '../../constants';
import { RuleErrorLogService } from './rule-error-log.service';
import { MediaService } from '../media/media.service';
import { EpisodeService } from '../series/episode.service';
import { MediaFileService } from '../media/media-file.service';
import { SeriesSubscribeService } from '../series/series-subscribe.service';
import { PluginService } from '../plugin/plugin.service';
import { FeedEntry } from '@extractus/feed-extractor';
import { Rule } from './rule.entity';
import { FetchLog } from './fetch-log.entity';
import { Source } from './source.entity';
import { Media } from '../media/media.entity';
import path from 'path';

@Injectable()
export class DownloadItemService implements OnModuleInit {
  constructor(
    @InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>,
    private aria2Service: Aria2Service,
    private ruleErrorLogService: RuleErrorLogService,
    private mediaService: MediaService,
    private episodeService: EpisodeService,
    private mediaFileService: MediaFileService,
    private seriesSubscribeService: SeriesSubscribeService,
    private pluginService: PluginService,
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

    await this.aria2Service.startTask(task);

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
      const medias: Media[] = [];

      // media files
      for (const file of files.filter((file) => VALID_VIDEO_MIME.includes(file.mimetype))) {
        const copy = Object.freeze(Object.assign({}, file));

        let descriptor: RuleFileDescriptor;
        try {
          descriptor = (await props.describeFn?.(entry, copy)) ?? {};
        } catch (error) {
          if (props.rule && props.describeFn) {
            await this.ruleErrorLogService.save({
              rule: { id: props.rule.id },
              entry: JSON.stringify(entry),
              error: error.toString(),
            });
          }

          continue;
        }

        const { id } = await this.mediaService.save({
          name: descriptor.name ?? file.name,
          description: descriptor.description,
          download: { id: item.id },
          isPublic: descriptor.isPublic ?? true,
          file: { id: file.id },
        });
        const media = await this.mediaService.findOneBy({ id });
        medias.push(media);
        await this.mediaFileService.generateMediaFiles(media);

        if (props.rule?.series) {
          await this.episodeService.save({
            title: descriptor.title ?? file.name,
            no: descriptor.no,
            pubAt: descriptor.pubAt ?? entry.published ?? new Date(),
            media: { id: media.id },
            series: { id: props.rule.series.id },
          });
        }
      }

      // attachment files
      for (const media of medias) {
        const attachments = files
          .filter((file) => !VALID_VIDEO_MIME.includes(file.mimetype))
          .filter((file) => path.dirname(media.file.path) === path.dirname(file.path));
        if (attachments.length > 0) {
          await this.mediaService.save({
            id: media.id,
            attachments: attachments.map(({ id }) => ({ id })),
          });
        }
      }

      // notify media update
      for (const media of medias) {
        await this.pluginService.emitAllEnabled('onNewMedia', media.id);
      }

      // notify series update
      if (props.rule?.series && medias.length > 0) {
        await this.seriesSubscribeService.notifyUpdate(props.rule.series);
        await this.pluginService.emitAllEnabled('onNewEpisode', props.rule.series.id);
      }
    });

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
