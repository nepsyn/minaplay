import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Series } from './series.entity';
import { DeepPartial, FindManyOptions, FindOneOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { File } from '../file/file.entity';
import { FileService } from '../file/file.service';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series) private seriesRepository: Repository<Series>,
    private fileService: FileService,
  ) {}

  async save(series: DeepPartial<Series>) {
    return await this.seriesRepository.save(series);
  }

  async findOne(options: FindOneOptions<Series>) {
    return await this.seriesRepository.findOne(options);
  }

  async findOneBy(where: FindOptionsWhere<Series>) {
    return await this.seriesRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Series>) {
    return await this.seriesRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Series>) {
    const series = await this.seriesRepository.find({ where });
    for (const item of series) {
      const ids = []
        .concat(item.poster)
        .filter((v) => v != null)
        .map((v: File) => v.id);
      await this.fileService.delete({
        id: In(ids),
      });
    }

    const result = await this.seriesRepository.softDelete(where);
    return result.affected > 0;
  }
}
