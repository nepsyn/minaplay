import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { SourceService } from '../source/source.service.js';
import { Job } from 'bull';
import { Source } from '../source/source.entity.js';
import { FetchLogService } from './fetch-log.service.js';
import { RuleService } from '../rule/rule.service.js';
import { DownloadItemService } from '../download-item.service.js';
import { StatusEnum } from '../../../enums/status.enum.js';
import { FeedData } from '@extractus/feed-extractor';
import { RuleErrorLogService } from '../rule/rule-error-log.service.js';
import { RuleHooks } from '../rule/rule.interface.js';
import { ApplicationLogger } from '../../../common/application.logger.service.js';

@Injectable()
@Processor('fetch-subscribe-source')
export class FetchSubscribeSourceConsumer {
  private logger = new ApplicationLogger(FetchSubscribeSourceConsumer.name);

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
    // find source
    const source = await this.sourceService.findOneBy({ id });

    // find rules
    const [rules] = await this.ruleService.findAndCount({
      where: {
        sources: {
          id: source.id,
        },
      },
    });
    const validRules = rules.filter((rule) => rule.file.isExist);

    // save initial log
    const log = await this.fetchLogService.save({
      source: { id: source.id },
      status: validRules.length > 0 ? StatusEnum.PENDING : StatusEnum.SUCCESS,
    });

    // no valid rules
    if (validRules.length === 0) {
      return;
    }

    // fetch RSS data
    let data: FeedData;
    try {
      data = await this.sourceService.readSource(source.url);
      await this.fetchLogService.save({
        id: log.id,
        source: { id: source.id },
        status: StatusEnum.SUCCESS,
      });
    } catch (error) {
      await this.fetchLogService.save({
        id: log.id,
        source: { id: source.id },
        status: StatusEnum.FAILED,
        error: error?.stack,
      });
      return;
    }
    if (data.entries.length <= 0) {
      return;
    }

    // validate entries
    const validEntries = data.entries.filter((entry) => entry.enclosure?.url);
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
            entry: JSON.stringify(entry),
            error: error.toString(),
          });
          break;
        }

        await this.downloadItemService.addAutoDownloadItemTask(entry, {
          describeFn: hooks.describe,
          rule,
          source,
          log,
        });
        this.logger.log(`Starting download entry: ${entry.title}`);
        count++;
      }
    }
    this.logger.log(
      `Fetch subscribe source ${source.title ?? source.remark ?? source.url} done, ${count} entry(s) downloading`,
    );
  }
}
