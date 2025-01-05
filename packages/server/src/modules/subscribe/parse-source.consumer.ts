import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { SourceService } from './source/source.service.js';
import { Job } from 'bull';
import { Source } from './source/source.entity.js';
import { ParseLogService } from './parse-log/parse-log.service.js';
import { RuleService } from './rule/rule.service.js';
import { StatusEnum } from '../../enums/index.js';
import { FeedData } from '@extractus/feed-extractor';
import { RuleErrorLogService } from './rule/rule-error-log.service.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { DownloadService } from './download/download.service.js';
import { generateMD5 } from '../../utils/generate-md5.util.js';
import { RuleVm } from './rule/rule.interface.js';
import { instanceToPlain } from 'class-transformer';
import { Rule } from './rule/rule.entity.js';

@Injectable()
@Processor('parse-source')
export class ParseSourceConsumer {
  private logger = new ApplicationLogger(ParseSourceConsumer.name);

  constructor(
    private sourceService: SourceService,
    private parseLogService: ParseLogService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private downloadService: DownloadService,
  ) {}

  @Process()
  async parseSubscribeSource(job: Job<Source>) {
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
    const log = await this.parseLogService.save({
      source: { id: source.id },
      status: validRules.length > 0 ? StatusEnum.PENDING : StatusEnum.SUCCESS,
    });

    // no valid rules
    if (validRules.length === 0) {
      this.logger.warn(
        `No subscribe rules for subscribe source '${source.title ?? source.remark ?? source.url}' while parsing`,
      );
      return;
    }

    // fetch RSS data
    let data: FeedData;
    try {
      data = await this.sourceService.readSource(source.url);
      await this.parseLogService.save({
        id: log.id,
        source: { id: source.id },
        status: StatusEnum.SUCCESS,
      });
    } catch (error) {
      await this.parseLogService.save({
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
      let vm: RuleVm | undefined = undefined;
      try {
        vm = await this.ruleService.createRuleVm(rule.code);
      } catch (error) {
        await this.ruleErrorLogService.save({
          rule: { id: rule.id },
          error: error.toString(),
        });
      }

      if (!vm || typeof vm.hooks.validate !== 'function') {
        vm?.release();
        continue;
      }

      for (const entry of validEntries) {
        const sameItem = await this.downloadService.findOneBy({ hash: await generateMD5(entry.enclosure.url) });
        if (sameItem) {
          continue;
        }

        try {
          const valid = await vm.hooks.validate?.(entry, {
            source: { ...instanceToPlain(source), parserMeta: source.parserMeta } as Source,
            rule: { ...instanceToPlain(rule), parserMeta: rule.parserMeta } as Rule,
            meta: vm.meta,
          });
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

        const task = await this.downloadService.createAutoDownloadTask(entry, {
          rule,
          source,
          log,
        });
        task.on('complete', () => {
          this.logger.log(`Download entry '${entry.title}' complete`);
        });
        this.logger.log(`Starting download entry '${entry.title}'`);
        count++;
      }

      vm.release();
    }
    this.logger.log(
      `Parse subscribe source '${source.title ?? source.remark ?? source.url}' done, ${count} entry(s) downloading`,
    );
  }
}
