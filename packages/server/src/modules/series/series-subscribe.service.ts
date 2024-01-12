import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { SeriesSubscribe } from './series-subscribe.entity.js';

@Injectable()
export class SeriesSubscribeService {
  constructor(@InjectRepository(SeriesSubscribe) private seriesSubscribeRepository: Repository<SeriesSubscribe>) {}

  async save(subscribe: DeepPartial<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.save(subscribe);
  }

  async findOneBy(where: FindOptionsWhere<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SeriesSubscribe>) {
    return await this.seriesSubscribeRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SeriesSubscribe>) {
    const result = await this.seriesSubscribeRepository.delete(where);
    return result.affected > 0;
  }
}
