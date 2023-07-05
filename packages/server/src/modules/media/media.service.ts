import { Inject, Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Media } from './media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaModuleOptions } from './media.module.interface';
import { randomUUID } from 'crypto';
import path from 'path';
import { USER_UPLOAD_IMAGE_DIR } from '../../constants';
import { createReadStream, ensureDirSync, pathExistsSync, stat } from 'fs-extra';
import { spawn } from 'child_process';
import { FileService } from '../file/file.service';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_MODULE_OPTIONS_TOKEN) private options: MediaModuleOptions,
    @InjectRepository(Media) private mediaRepository: Repository<Media>,
    private fileService: FileService,
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

  private escapePath(path: string) {
    return path.replace(/\\/g, '\\\\');
  }

  async generatePosterFile(media: Media) {
    if (media.file) {
      // 计算缩略图路径
      const posterFileName = randomUUID().replace(/-/g, '') + '.png';
      ensureDirSync(USER_UPLOAD_IMAGE_DIR);
      // 获取视频文件路径
      const mediaFilePath = media.file.path;
      // 生成缩略图
      const cp = spawn(
        `"${this.escapePath(this.options.ffmpegPath)}"`,
        [
          `-i "${this.escapePath(mediaFilePath)}"`,
          '-threads 2',
          '-ss 00:00:01.000',
          '-vframes 1',
          this.escapePath(posterFileName),
        ],
        {
          cwd: USER_UPLOAD_IMAGE_DIR,
          shell: true,
          timeout: 60000,
        },
      );
      cp.on('exit', async () => {
        const posterFilePath = path.join(USER_UPLOAD_IMAGE_DIR, posterFileName);
        if (pathExistsSync(posterFilePath)) {
          const fileStat = await stat(posterFilePath);
          const file = await this.fileService.save({
            filename: posterFileName,
            name: posterFileName,
            size: fileStat.size,
            md5: await generateMD5(createReadStream(posterFilePath)),
            mimetype: 'image/png',
            source: FileSourceEnum.AUTO_GENERATED,
            path: posterFilePath,
          });
          await this.mediaRepository.save({
            id: media.id,
            poster: { id: file.id },
          });
        }
      });
    }
  }
}
