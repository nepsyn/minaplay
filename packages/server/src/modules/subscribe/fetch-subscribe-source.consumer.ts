import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { SourceService } from './source.service';
import { Job } from 'bull';
import { Source } from './source.entity';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';
import { FetchLogService } from './fetch-log.service';
import { RuleService } from './rule.service';
import { DownloadItemService } from './download-item.service';
import { Aria2Service } from '../aria2/aria2.service';
import { NodeVM } from 'vm2';
import { VALID_VIDEO_MIME } from '../../constants';
import { EpisodeService } from '../series/episode.service';
import { MediaService } from '../media/media.service';
import { MediaFileService } from '../media/media-file.service';
import { MediaDescriptor } from '../media/media.descriptor.interface';
import { DownloadItem } from './download-item.entity';
import { DeepPartial } from 'typeorm';
import { File } from '../file/file.entity';

@Injectable()
@Processor('fetch-subscribe-source')
export class FetchSubscribeSourceConsumer {
  constructor(
    private sourceService: SourceService,
    private fetchLogService: FetchLogService,
    private ruleService: RuleService,
    private downloadItemService: DownloadItemService,
    private aria2Service: Aria2Service,
    private episodeService: EpisodeService,
    private mediaService: MediaService,
    private mediaFileService: MediaFileService,
  ) {}

  private async buildValue<T extends string | boolean>(
    fnOrValue?: ((file: File) => Promise<T> | T) | T,
    file?: File,
  ): Promise<T> {
    if (typeof fnOrValue === 'function') {
      return fnOrValue(file);
    } else if (fnOrValue !== undefined) {
      return fnOrValue;
    } else {
      return undefined;
    }
  }

  @Process()
  async fetchSubscribeSource(job: Job<Source>) {
    const { id } = job.data;
    const source = await this.sourceService.findOneBy({ id });

    try {
      const data = await this.sourceService.readSource(source.url);
      const log = await this.fetchLogService.save({
        source: { id: source.id },
        success: true,
      });

      if (data.entries.length > 0) {
        const [rules] = await this.ruleService.findAndCount({
          where: {
            source: { id: source.id },
          },
        });
        const validRules = rules.filter((rule) => rule.codeFile.isExist);

        const vm = new NodeVM({
          require: false,
          timeout: 1000,
          allowAsync: true,
        });

        for (const rule of validRules) {
          const validEntries = data.entries.filter((entry) => entry.enclosure?.url);
          const validatorFunc = vm.runFile(rule.codeFile.path);
          for (const entry of validEntries) {
            const descriptor: MediaDescriptor = await validatorFunc(entry);
            if (descriptor) {
              const sameNameItem = await this.downloadItemService.findOneBy({ title: entry.title });
              if (sameNameItem) {
                continue;
              }

              const itemProps: DeepPartial<DownloadItem> = {
                title: entry.title,
                url: entry.enclosure.url,
                source: { id: source.id },
                rule: { id: rule.id },
                log: { id: log.id },
              };
              const item = await this.downloadItemService.save({
                ...itemProps,
                status: SubscribeDownloadItemStatusEnum.DOWNLOADING,
              });

              const task = await this.aria2Service.addTask(entry.enclosure.url);
              task.on('complete', async (files) => {
                for (const file of files) {
                  if (VALID_VIDEO_MIME.includes(file.mimetype)) {
                    const copy = Object.freeze(Object.assign({}, file));

                    const { id } = await this.mediaService.save({
                      name: (await this.buildValue(descriptor.name, copy)) ?? file.name,
                      description: await this.buildValue(descriptor.description, copy),
                      download: { id: item.id },
                      isPublic: (await this.buildValue(descriptor.isPublic, copy)) ?? true,
                      file: { id: file.id },
                    });
                    const media = await this.mediaService.findOneBy({ id });
                    await this.mediaFileService.generateMediaFiles(media);

                    if (rule.series) {
                      await this.episodeService.save({
                        title: await this.buildValue(descriptor.title, copy),
                        no: await this.buildValue(descriptor.no, copy),
                        media: { id: media.id },
                        series: { id: rule.series.id },
                      });
                    }
                  }
                }

                await this.downloadItemService.save({
                  id: item.id,
                  ...itemProps,
                  status: SubscribeDownloadItemStatusEnum.DOWNLOADED,
                });
              });
              task.on('error', async (status) => {
                await this.downloadItemService.save({
                  id: item.id,
                  ...itemProps,
                  status: SubscribeDownloadItemStatusEnum.FAILED,
                  error: status.errorMessage,
                });
              });
            }
          }
        }
      }
    } catch (error) {
      await this.fetchLogService.save({
        source: { id: source.id },
        success: false,
        error: error?.stack,
      });
    }
  }
}
