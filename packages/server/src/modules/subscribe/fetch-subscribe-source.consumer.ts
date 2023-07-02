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
  ) {}

  @Process()
  async fetchSubscribeSource(job: Job<Source>) {
    const source = job.data;

    try {
      const data = await this.sourceService.readSource(source.url);

      if (data.entries.length > 0) {
        const [rules] = await this.ruleService.findAndCount({
          where: {
            source: { id: source.id },
          },
        });

        const vm = new NodeVM({
          require: false,
          timeout: 1000,
          allowAsync: true,
        });
        const validRules = rules.filter((rule) => rule.codeFile.isExist);
        for (const rule of validRules) {
          const validEntries = data.entries.filter((entry) => entry.enclosure?.url);
          const validatorFunc = vm.runFile(rule.codeFile.path);
          for (const entry of validEntries) {
            const valid = validatorFunc(entry);
            if (valid) {
              const sameNameItem = await this.downloadItemService.findOneBy({ title: entry.title });
              if (sameNameItem) {
                continue;
              }

              const item = await this.downloadItemService.save({
                title: entry.title,
                url: entry.enclosure.url,
                source: { id: source.id },
                rule: { id: rule.id },
                status: SubscribeDownloadItemStatusEnum.DOWNLOADING,
              });

              const task = await this.aria2Service.addTask(entry.enclosure.url);
              task.on('complete', async (files) => {
                for (const file of files) {
                  if (VALID_VIDEO_MIME.includes(file.mimetype) && rule.series) {
                    await this.episodeService.save({
                      title: file.filename,
                      series: { id: rule.series.id },
                      file: { id: file.id },
                    });
                  }
                }

                await this.downloadItemService.save({
                  id: item.id,
                  status: SubscribeDownloadItemStatusEnum.DOWNLOADED,
                });
              });
              task.on('error', async (status) => {
                await this.downloadItemService.save({
                  id: item.id,
                  status: SubscribeDownloadItemStatusEnum.FAILED,
                  error: status.errorMessage,
                });
              });
            }
          }
        }
      }

      await this.fetchLogService.save({
        source: { id: source.id },
        success: true,
        data: JSON.stringify(data),
      });
    } catch (error) {
      await this.fetchLogService.save({
        source: { id: source.id },
        success: false,
        error: error?.stack,
      });
    }
  }
}
