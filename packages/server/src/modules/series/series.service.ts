import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Series } from './series.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SeriesService {
  constructor(@InjectRepository(Series) private seriesRepository: Repository<Series>) {}

  async save(series: DeepPartial<Series>) {
    return await this.seriesRepository.save(series);
  }

  async findOneBy(where: FindOptionsWhere<Series>) {
    return await this.seriesRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Series>) {
    return await this.seriesRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Series>) {
    const result = await this.seriesRepository.softDelete(where);
    return result.affected > 0;
  }
}
