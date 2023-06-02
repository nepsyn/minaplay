import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { SubscribeSourceService } from './subscribe-source.service';
import { Job } from 'bull';
import { SubscribeSource } from './subscribe-source.entity';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';
import { SubscribeFetchErrorService } from './subscribe-fetch-error.service';
import { SubscribeRuleService } from './subscribe-rule.service';
import { SubscribeDownloadItemService } from './subscribe-download-item.service';
import { Aria2Service } from '../aria2/aria2.service';
import { NodeVM } from 'vm2';
import { VALID_VIDEO_MIME } from '../../constants';
import { EpisodeService } from '../series/episode.service';

@Injectable()
@Processor('fetch-subscribe-source')
export class FetchSubscribeSourceConsumer {
  constructor(
    private subscribeSourceService: SubscribeSourceService,
    private subscribeParseLogService: SubscribeFetchErrorService,
    private subscribeRuleService: SubscribeRuleService,
    private subscribeDownloadItemService: SubscribeDownloadItemService,
    private aria2Service: Aria2Service,
    private episodeService: EpisodeService,
  ) {}

  @Process()
  async fetchSubscribeSource(job: Job<SubscribeSource>) {
    const source = job.data;

    try {
      const data = await this.subscribeSourceService.readSource(source.url);

      if (data.entries.length > 0) {
        const [rules] = await this.subscribeRuleService.findAndCount({
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
              const sameNameItem = await this.subscribeDownloadItemService.findOneBy({ title: entry.title });
              if (sameNameItem) {
                continue;
              }

              const item = await this.subscribeDownloadItemService.save({
                title: entry.title,
                url: entry.enclosure.url,
                rule: { id: rule.id },
                status: SubscribeDownloadItemStatusEnum.DOWNLOADING,
              });

              const task = await this.aria2Service.addTask(entry.enclosure.url);
              task.on('complete', async (files) => {
                for (const file of files) {
                  if (VALID_VIDEO_MIME.includes(file.mimetype)) {
                    await this.episodeService.save({
                      title: file.filename,
                      series: { id: rule.series.id },
                      file: { id: file.id },
                    });
                  }
                }

                await this.subscribeDownloadItemService.save({
                  id: item.id,
                  status: SubscribeDownloadItemStatusEnum.DOWNLOADED,
                });
              });
              task.on('error', async (status) => {
                await this.subscribeDownloadItemService.save({
                  id: item.id,
                  status: SubscribeDownloadItemStatusEnum.FAILED,
                  error: status.errorMessage,
                });
              });
            }
          }
        }
      }
    } catch (error) {
      await this.subscribeParseLogService.save({
        source: { id: source.id },
        error: error?.stack,
      });
    }
  }
}
