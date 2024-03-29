import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Episode } from './episode.entity.js';
import {
  Between,
  DataSource,
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { EpisodeUpdateQueryDto } from './episode-update-query.dto.js';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode) private episodeRepository: Repository<Episode>,
    private dataSource: DataSource,
  ) {}

  async save(episode: DeepPartial<Episode>) {
    return await this.episodeRepository.save(episode);
  }

  async findOne(options: FindOneOptions<Episode>) {
    return await this.episodeRepository.findOne(options);
  }

  async findOneBy(where: FindOptionsWhere<Episode>) {
    return await this.episodeRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Episode>) {
    return await this.episodeRepository.findAndCount(options);
  }

  async findUpdateAndCount(query: EpisodeUpdateQueryDto) {
    const { page, size, start, end } = query;
    const resultRaw: { id: number }[] = await this.dataSource
      .createQueryBuilder()
      .select('id,updateAt,pubAt')
      .from(
        (qb) =>
          qb
            .select('id,seriesId,updateAt,pubAt')
            .addSelect('ROW_NUMBER() OVER (PARTITION BY seriesId ORDER BY pubAt DESC,updateAt DESC)', 'row_num')
            .from(Episode, 'ep'),
        'ranked',
      )
      .where({
        row_num: 1,
        ...(start ? { pubAt: Between(new Date(start), end ? new Date(end) : new Date()) } : {}),
      })
      .orderBy('pubAt', 'DESC')
      .addOrderBy('updateAt', 'DESC')
      .skip(page)
      .take(size)
      .getRawMany();
    const result = await this.episodeRepository.find({
      where: {
        id: In(resultRaw.map(({ id }) => id)),
      },
      order: {
        pubAt: 'DESC',
        updateAt: 'DESC',
      },
    });
    const countRaw: { total: number }[] = await this.episodeRepository
      .createQueryBuilder()
      .select('COUNT(DISTINCT seriesId)', 'total')
      .getRawMany();
    const count = countRaw[0].total;

    return [result, count] as const;
  }

  async delete(where: FindOptionsWhere<Episode>) {
    const result = await this.episodeRepository.delete(where);
    return result.affected > 0;
  }
}
