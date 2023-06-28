import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { LiveState } from './live.state';
import { instanceToPlain } from 'class-transformer';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(Live) private liveRepository: Repository<Live>,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
  ) {}

  async save(live: DeepPartial<Live>) {
    return await this.liveRepository.save(live);
  }

  async findOneBy(where: FindOptionsWhere<Live>) {
    return await this.liveRepository.findOneBy(where);
  }

  async delete(where: FindOptionsWhere<Live>) {
    const result = await this.liveRepository.delete(where);
    return result.affected > 0;
  }

  async createLiveState(id: string, renew = false): Promise<LiveState | undefined> {
    const cacheKey = `live:${id}`;

    if (!renew) {
      const state: LiveState = await this.cacheStore.get(cacheKey);
      if (state) {
        return state;
      }
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
      await this.cacheStore.set(cacheKey, state);
      return state;
    }

    return undefined;
  }

  async updateLiveState(state: LiveState) {
    await this.cacheStore.set(`live:${state.live.id}`, state);
  }

  async deleteLiveState(id: string) {
    await this.cacheStore.del(`live:${id}`);
  }
}
