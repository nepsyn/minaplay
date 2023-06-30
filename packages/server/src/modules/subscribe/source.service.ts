import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Source } from './source.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { extract } from '@extractus/feed-extractor';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SourceService implements OnModuleInit {
  constructor(
    @InjectRepository(Source) private sourceRepository: Repository<Source>,
    private scheduleRegistry: SchedulerRegistry,
    @InjectQueue('fetch-subscribe-source') private fetchSubscribeSourceQueue: Queue,
  ) {}

  static buildFetchJobName(id: number) {
    return `source-${id}-fetch-job`;
  }

  async onModuleInit() {
    const [sources] = await this.findAndCount();
    for (const source of sources.filter((source) => source.enabled)) {
      await this.addFetchSubscribeDataJob(source);
    }
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
    return await extract(url, {
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
    });
  }

  async addFetchSubscribeDataJob(source: Source) {
    const name = SourceService.buildFetchJobName(source.id);
    const job = new CronJob({
      cronTime: source.cron,
      onTick: async () => await this.fetchSubscribeSourceQueue.add(source),
    });

    this.scheduleRegistry.addCronJob(name, job);
  }

  async runFetchSubscribeDataJob(source: Source) {
    await this.fetchSubscribeSourceQueue.add(source);
  }

  async deleteFetchSubscribeDataJob(id: number) {
    const name = SourceService.buildFetchJobName(id);
    if (this.scheduleRegistry.doesExist('cron', name)) {
      this.scheduleRegistry.deleteCronJob(name);
    }
  }
}
