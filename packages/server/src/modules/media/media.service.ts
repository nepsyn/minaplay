import { Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { Media } from './media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FileService } from '../file/file.service';
import { File } from '../file/file.entity';

@Injectable()
export class MediaService {
  constructor(@InjectRepository(Media) private mediaRepository: Repository<Media>, private fileService: FileService) {}

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
    const medias = await this.mediaRepository.find({ where });
    for (const media of medias) {
      const ids = []
        .concat(media.file)
        .concat(media.poster)
        .concat(media.attachments)
        .filter((v) => v != null)
        .map((v: File) => v.id);
      await this.fileService.delete({
        id: In(ids),
      });
    }

    const result = await this.mediaRepository.delete(where);
    return result.affected > 0;
  }
}
