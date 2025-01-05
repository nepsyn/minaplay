import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Source } from './source.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SubscribeModuleOptions } from '../subscribe.module.interface.js';
import { SUBSCRIBE_MODULE_OPTIONS_TOKEN } from '../subscribe.module-definition.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ApplicationLogger } from '../../../common/application.logger.service.js';
import { extract } from '@extractus/feed-extractor';

@Injectable()
export class SourceService implements OnModuleInit {
  private logger = new ApplicationLogger(SourceService.name);

  constructor(
    @Inject(SUBSCRIBE_MODULE_OPTIONS_TOKEN)
    private options: SubscribeModuleOptions,
    @InjectRepository(Source) private sourceRepository: Repository<Source>,
    private scheduleRegistry: SchedulerRegistry,
    @InjectQueue('parse-source') private fetchSubscribeSourceQueue: Queue,
  ) {}

  static buildFetchJobName(id: number) {
    return `source-${id}-fetch-job`;
  }

  async onModuleInit() {
    const [sources] = await this.findAndCount();
    for (const source of sources.filter((source) => source.enabled)) {
      try {
        await this.addFetchSubscribeDataJob(source);
      } catch (error) {
        this.logger.error(`Source(id:${source.id}) fetch job startup failed`, error.stack, SourceService.name);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanFetchSubscribeDataJobs() {
    await this.fetchSubscribeSourceQueue.clean(0, 'completed');
    await this.fetchSubscribeSourceQueue.clean(0, 'failed');
  }

  async save(source: DeepPartial<Source>) {
    return await this.sourceRepository.save(source);
  }

  async findOneBy(where: FindOptionsWhere<Source>) {
    return this.sourceRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Source>) {
    return await this.sourceRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Source>) {
    const result = await this.sourceRepository.delete(where);
    return result.affected > 0;
  }

  async readSource(url: string) {
    return await extract(
      url,
      {
        getExtraEntryFields: ({ enclosure }: any) => {
          if (enclosure) {
            return {
              enclosure: {
                url: enclosure?.['@_url'],
                type: enclosure?.['@_type'],
              },
            };
          } else {
            return {
              enclosure: undefined,
            };
          }
        },
      },
      {
        agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      },
    );
  }

  async addFetchSubscribeDataJob(source: Source) {
    const name = SourceService.buildFetchJobName(source.id);
    const job = CronJob.from({
      cronTime: source.cron,
      onTick: async () => {
        await this.fetchSubscribeSourceQueue.add(source, { attempts: 3 });
      },
    });
    this.scheduleRegistry.addCronJob(name, job as any);
    job.start();
  }

  async runFetchSubscribeDataJob(source: Source) {
    await this.fetchSubscribeSourceQueue.add(source);
  }

  async deleteFetchSubscribeDataJob(id: number) {
    const name = SourceService.buildFetchJobName(id);
    if (this.scheduleRegistry.doesExist('cron', name)) {
      const job = this.scheduleRegistry.getCronJob(name);
      job.stop();
      this.scheduleRegistry.deleteCronJob(name);
    }
  }
}
