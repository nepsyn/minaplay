import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Episode } from './episode.entity';
import { DeepPartial, FindManyOptions, FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class EpisodeService {
  constructor(@InjectRepository(Episode) private episodeRepository: Repository<Episode>) {}

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

  async findLatestIds(skip?: number, take?: number): Promise<[{ id: number }[], number]> {
    const query = this.episodeRepository.createQueryBuilder('episode');
    query
      .select('id')
      .where(
        '(episode.seriesId, episode.pubAt) IN ' +
          query.subQuery().select('seriesId, MAX(pubAt)').from(Episode, 'ep').groupBy('ep.seriesId').getQuery(),
      )
      .orderBy('episode.pubAt', 'DESC')
      .skip(skip)
      .take(take);

    return [await query.getRawMany(), await query.getCount()];
  }

  async delete(where: FindOptionsWhere<Episode>) {
    const result = await this.episodeRepository.softDelete(where);
    return result.affected > 0;
  }
}
