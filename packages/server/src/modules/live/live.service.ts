import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { LiveCache } from './live.cache';
import { instanceToPlain } from 'class-transformer';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(Live) private liveRepository: Repository<Live>,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
  ) {}

  async save(live: DeepPartial<Live>) {
    return this.liveRepository.create(await this.liveRepository.save(live));
  }

  async findOneBy(where: FindOptionsWhere<Live>) {
    return await this.liveRepository.findOneBy(where);
  }

  async delete(where: FindOptionsWhere<Live>) {
    const result = await this.liveRepository.delete(where);
    return result.affected > 0;
  }

  async getLiveCache(id: string): Promise<LiveCache | undefined> {
    const cacheKey = `live:${id}`;

    const cache: LiveCache = await this.cacheStore.get(cacheKey);
    if (cache) {
      return cache;
    }

    const live = await this.findOneBy({ id });
    if (live) {
      const cache = {
        live: instanceToPlain(live) as Live,
        users: [],
        streams: [],
        updateAt: new Date(),
      };
      await this.cacheStore.set(cacheKey, cache);
      return cache;
    }

    return undefined;
  }

  async updateLiveCache(cache: LiveCache) {
    await this.cacheStore.set(`live:${cache.live.id}`, cache);
  }

  async deleteLiveCache(id: string) {
    await this.cacheStore.del(`live:${id}`);
  }
}
