import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscribeSource } from './subscribe-source.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { extract } from '@extractus/feed-extractor';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SubscribeSourceService implements OnModuleInit {
  constructor(
    @InjectRepository(SubscribeSource) private subscribeSourceRepository: Repository<SubscribeSource>,
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

  async save(source: DeepPartial<SubscribeSource>) {
    return await this.subscribeSourceRepository.save(source);
  }

  async findOneBy(where: FindOptionsWhere<SubscribeSource>) {
    return this.subscribeSourceRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SubscribeSource>) {
    return await this.subscribeSourceRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SubscribeSource>) {
    const result = await this.subscribeSourceRepository.delete(where);
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

  async addFetchSubscribeDataJob(source: SubscribeSource) {
    const name = SubscribeSourceService.buildFetchJobName(source.id);
    const job = new CronJob({
      cronTime: source.cron,
      onTick: async () => this.fetchSubscribeSourceQueue.add(source),
      runOnInit: true,
    });

    this.scheduleRegistry.addCronJob(name, job);
  }

  async deleteFetchSubscribeDataJob(id: number) {
    const name = SubscribeSourceService.buildFetchJobName(id);
    if (this.scheduleRegistry.doesExist('cron', name)) {
      this.scheduleRegistry.deleteCronJob(name);
    }
  }
}
