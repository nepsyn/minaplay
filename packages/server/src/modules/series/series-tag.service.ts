import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeriesTag } from './series-tag.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SeriesTagService {
  constructor(@InjectRepository(SeriesTag) private seriesTagRepository: Repository<SeriesTag>) {}

  async save(tag: DeepPartial<SeriesTag>) {
    return await this.seriesTagRepository.save(tag);
  }

  async findOneBy(where: FindOptionsWhere<SeriesTag>) {
    return await this.seriesTagRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SeriesTag>) {
    return await this.seriesTagRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SeriesTag>) {
    const result = await this.seriesTagRepository.softDelete(where);
    return result.affected > 0;
  }
}
