import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { MediaModuleOptions } from './media.module.interface';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import { GENERATED_IMAGE_DIR, GENERATED_METADATA_DIR } from '../../constants';
import path from 'node:path';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';
import type Execa from 'execa';
import { importDynamic } from '../../utils/import-dynamic.util';

@Injectable()
export class MediaFileService {
  private logger = new ConsoleLogger(MediaFileService.name);

  constructor(
    @Inject(MEDIA_MODULE_OPTIONS_TOKEN) private options: MediaModuleOptions,
    private fileService: FileService,
    private mediaService: MediaService,
  ) {}

  async generateMediaPosterFile(media: Media) {
    const execa: typeof Execa.execa = (await importDynamic('execa')).execa;

    // 计算缩略图路径
    const posterFileName = randomUUID().replace(/-/g, '') + '.png';
    const posterFilePath = path.join(GENERATED_IMAGE_DIR, posterFileName);
    await fs.ensureDir(GENERATED_IMAGE_DIR);
    // 获取视频文件路径
    try {
      await execa(
        this.options.ffmpegPath,
        [`-i`, media.file.path, '-threads 2', '-ss 00:00:01.000', '-vframes 1', posterFileName],
        {
          cwd: GENERATED_IMAGE_DIR,
          shell: true,
          timeout: 5000,
        },
      );

      // 生成缩略图
      const fileStat = await fs.stat(posterFilePath);
      const file = await this.fileService.save({
        filename: posterFileName,
        name: posterFileName,
        size: fileStat.size,
        md5: await generateMD5(fs.createReadStream(posterFilePath)),
        mimetype: 'image/png',
        source: FileSourceEnum.AUTO_GENERATED,
        path: posterFilePath,
      });
      await this.mediaService.save({
        id: media.id,
        poster: { id: file.id },
      });
      this.logger.debug(`poster file '${file.id}' created for media '${media.id}'`);

      return file;
    } catch {
      this.logger.error(`poster file create failed for media '${media.id}'`);
    }
  }

  async generateMediaMetadataFile(media: Media) {
    const execa: typeof Execa.execa = (await importDynamic('execa')).execa;

    // 计算缩略图路径
    const metadataFileName = randomUUID().replace(/-/g, '') + '.json';
    const metadataFilePath = path.join(GENERATED_METADATA_DIR, metadataFileName);
    await fs.ensureDir(GENERATED_METADATA_DIR);

    // 获取视频文件路径
    try {
      const cp = await execa(
        this.options.ffprobePath,
        [`-i`, media.file.path, '-v quiet', '-print_format json', '-show_format', '-show_streams'],
        {
          cwd: GENERATED_METADATA_DIR,
          shell: true,
          timeout: 5000,
        },
      );
      await fs.writeFile(metadataFilePath, cp.stdout);

      const fileStat = await fs.stat(metadataFilePath);
      const file = await this.fileService.save({
        filename: metadataFileName,
        name: metadataFileName,
        size: fileStat.size,
        md5: await generateMD5(fs.createReadStream(metadataFilePath)),
        mimetype: 'application/json',
        source: FileSourceEnum.AUTO_GENERATED,
        path: metadataFilePath,
      });
      await this.mediaService.save({
        id: media.id,
        metadata: { id: file.id },
      });
      this.logger.debug(`metadata file '${file.id}' created for media '${media.id}'`);

      return file;
    } catch {
      this.logger.error(`metadata file create failed for media '${media.id}'`);
    }
  }
}
