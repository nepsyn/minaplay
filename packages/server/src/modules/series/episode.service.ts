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

  async delete(where: FindOptionsWhere<Episode>) {
    const result = await this.episodeRepository.delete(where);
    return result.affected > 0;
  }
}
