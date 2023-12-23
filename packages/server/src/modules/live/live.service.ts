import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { LiveState } from './live.state';
import { instanceToPlain } from 'class-transformer';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class LiveService implements OnModuleInit {
  constructor(
    @InjectRepository(Live) private liveRepository: Repository<Live>,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
  ) {}

  async onModuleInit() {
    const lives = await this.liveRepository.find();
    for (const live of lives) {
      await this.deleteLiveState(live.id);
    }
  }

  async save(live: DeepPartial<Live>) {
    return await this.liveRepository.save(live);
  }

  async findOneBy(where: FindOptionsWhere<Live>) {
    return await this.liveRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Live>) {
    return await this.liveRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Live>) {
    const result = await this.liveRepository.delete(where);
    return result.affected > 0;
  }

  async createOrGetLiveState(id: string): Promise<LiveState | undefined> {
    const cacheKey = `live:${id}`;

    const state: LiveState = await this.cacheStore.get(cacheKey);
    if (state) {
      return state;
    }

    const live = await this.findOneBy({ id });
    if (live) {
      const state: LiveState = {
        live: instanceToPlain(live) as Live,
        users: [],
        muted: {
          chat: [],
          voice: [],
        },
        stream: undefined,
        updateAt: new Date(),
      };
      await this.cacheStore.set(cacheKey, state, 0);
      return state;
    }

    return undefined;
  }

  async updateLiveState(state: LiveState) {
    await this.cacheStore.set(`live:${state.live.id}`, state, 0);
  }

  async deleteLiveState(id: string) {
    await this.cacheStore.del(`live:${id}`);
  }
}
