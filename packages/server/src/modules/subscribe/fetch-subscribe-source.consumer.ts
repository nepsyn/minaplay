import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { SourceService } from './source.service';
import { Job } from 'bull';
import { Source } from './source.entity';
import { FetchLogService } from './fetch-log.service';
import { RuleService } from './rule.service';
import { DownloadItemService } from './download-item.service';
import { VALID_VIDEO_MIME } from '../../constants';
import { EpisodeService } from '../series/episode.service';
import { MediaService } from '../media/media.service';
import { MediaFileService } from '../media/media-file.service';
import { StatusEnum } from '../../enums/status.enum';
import { FeedData } from '@extractus/feed-extractor';
import { RuleErrorLogService } from './rule-error-log.service';
import { RuleFileDescriptor, RuleHooks } from './rule.interface';
import { SeriesSubscribeService } from '../series/series-subscribe.service';

@Injectable()
@Processor('fetch-subscribe-source')
export class FetchSubscribeSourceConsumer {
  constructor(
    private sourceService: SourceService,
    private fetchLogService: FetchLogService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private downloadItemService: DownloadItemService,
    private episodeService: EpisodeService,
    private seriesSubscribeService: SeriesSubscribeService,
    private mediaService: MediaService,
    private mediaFileService: MediaFileService,
  ) {}

  @Process()
  async fetchSubscribeSource(job: Job<Source>) {
    const { id } = job.data;
    const source = await this.sourceService.findOneBy({ id });

    const log = await this.fetchLogService.save({
      source: { id: source.id },
      status: StatusEnum.PENDING,
    });

    let data: FeedData;
    try {
      data = await this.sourceService.readSource(source.url);
      await this.fetchLogService.save({
        id: log.id,
        source: { id: source.id },
        status: StatusEnum.SUCCESS,
      });
      if (data.entries.length <= 0) {
        return;
      }
    } catch (error) {
      await this.fetchLogService.save({
        id: log.id,
        source: { id: source.id },
        status: StatusEnum.FAILED,
        error: error?.stack,
      });
      return;
    }

    const [rules] = await this.ruleService.findAndCount({
      where: {
        source: { id: source.id },
      },
    });

    const validEntries = data.entries.filter((entry) => entry.enclosure?.url);
    const validRules = rules.filter((rule) => rule.codeFile.isExist);

    for (const rule of validRules) {
      let hooks: RuleHooks;
      try {
        const vm = await this.ruleService.createRuleVm(rule.code);
        hooks = vm.hooks;
      } catch (error) {
        await this.ruleErrorLogService.save({
          rule: { id: rule.id },
          error: error.toString(),
        });
        continue;
      }

      if (typeof hooks.validate !== 'function') {
        continue;
      }

      for (const entry of validEntries) {
        const sameUrlItem = await this.downloadItemService.findOneBy({ url: entry.enclosure.url });
        if (sameUrlItem) {
          continue;
        }

        try {
          const valid = await hooks.validate?.(entry);
          if (!valid) {
            continue;
          }
        } catch (error) {
          await this.ruleErrorLogService.save({
            rule: { id: rule.id },
            error: error.toString(),
          });
          break;
        }

        const [task, item] = await this.downloadItemService.addDownloadItemTask(entry.enclosure.url, {
          title: entry.title,
          url: entry.enclosure.url,
          source: { id: source.id },
          rule: { id: rule.id },
          log: { id: log.id },
          entry: JSON.stringify(entry),
        });
        task.on('complete', async (files) => {
          for (const file of files) {
            if (VALID_VIDEO_MIME.includes(file.mimetype)) {
              const copy = Object.freeze(Object.assign({}, file));

              let descriptor: RuleFileDescriptor;
              try {
                descriptor = (await hooks.describe?.(entry, copy)) ?? {};
              } catch (error) {
                await this.ruleErrorLogService.save({
                  rule: { id: rule.id },
                  error: error.toString(),
                });
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
              await this.mediaFileService.generateMediaFiles(media);

              if (rule.series) {
                await this.episodeService.save({
                  title: descriptor.title ?? file.name,
                  no: descriptor.no,
                  pubAt: descriptor.pubAt ?? entry.published ?? new Date(),
                  media: { id: media.id },
                  series: { id: rule.series.id },
                });
              }
            }
          }

          if (rule.series) {
            await this.seriesSubscribeService.notifyUpdate(rule.series);
          }
        });
      }
    }
  }
}
