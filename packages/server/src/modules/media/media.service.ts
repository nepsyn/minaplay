import { Inject, Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Media } from './media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaModuleOptions } from './media.module.interface';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_MODULE_OPTIONS_TOKEN) private options: MediaModuleOptions,
    @InjectRepository(Media) private mediaRepository: Repository<Media>,
  ) {}

  async save(media: DeepPartial<Media>) {
    return await this.mediaRepository.save(media);
  }

  async findOneBy(where: FindOptionsWhere<Media>) {
    return await this.mediaRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Media>) {
    return await this.mediaRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Media>) {
    const result = await this.mediaRepository.delete(where);
    return result.affected > 0;
  }
}
