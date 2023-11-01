import { Process, Processor } from '@nestjs/bull';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { SourceService } from './source.service';
import { Job } from 'bull';
import { Source } from './source.entity';
import { FetchLogService } from './fetch-log.service';
import { RuleService } from './rule.service';
import { DownloadItemService } from './download-item.service';
import { StatusEnum } from '../../enums/status.enum';
import { FeedData } from '@extractus/feed-extractor';
import { RuleErrorLogService } from './rule-error-log.service';
import { RuleHooks } from './rule.interface';

@Injectable()
@Processor('fetch-subscribe-source')
export class FetchSubscribeSourceConsumer {
  private logger = new ConsoleLogger(FetchSubscribeSourceConsumer.name);

  constructor(
    private sourceService: SourceService,
    private fetchLogService: FetchLogService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private downloadItemService: DownloadItemService,
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

    let count = 0;
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
        const sameItem = await this.downloadItemService.findOneBy({ title: entry.title });
        if (sameItem) {
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

        await this.downloadItemService.addAutoDownloadItemTask(Object.freeze(entry), rule, log, hooks.describe);
        this.logger.log(`Starting download entry: ${entry.title}`);
        count++;
      }
    }
    this.logger.log(
      `Fetch subscribe source ${source.title ?? source.remark ?? source.url} done, ${count} entries downloading`,
    );
  }
}
