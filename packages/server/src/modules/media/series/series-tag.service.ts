import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeriesTag } from './series-tag.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SeriesTagService {
  constructor(@InjectRepository(SeriesTag) private seriesTagRepository: Repository<SeriesTag>) {}

  save(tag: DeepPartial<SeriesTag>): Promise<SeriesTag>;
  save(tag: DeepPartial<SeriesTag>[]): Promise<SeriesTag[]>;
  async save(tag: any) {
    return await this.seriesTagRepository.save(tag);
  }

  async findOneBy(where: FindOptionsWhere<SeriesTag>) {
    return await this.seriesTagRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SeriesTag>) {
    return await this.seriesTagRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SeriesTag>) {
    const result = await this.seriesTagRepository.delete(where);
    return result.affected > 0;
  }
}
