import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { MediaModuleOptions } from './media.module.interface';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import fs from 'fs-extra';
import { GENERATED_DIR } from '../../constants';
import path from 'node:path';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';
import { importESM } from '../../utils/import-esm.util';
import { MediaMetadata } from '../../interfaces/media.metadata';

@Injectable()
export class MediaFileService {
  private logger = new ConsoleLogger(MediaFileService.name);

  constructor(
    @Inject(MEDIA_MODULE_OPTIONS_TOKEN) private options: MediaModuleOptions,
    private fileService: FileService,
    private mediaService: MediaService,
  ) {}

  async generateMediaMetadata(media: Media) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    const cp = await execa(
      this.options.ffprobePath,
      ['-i', `"${media.file.path}"`, '-print_format json', '-show_streams'],
      {
        shell: true,
        timeout: 60000,
        reject: false,
      },
    );

    try {
      return JSON.parse(cp.stdout) as MediaMetadata;
    } catch {
      this.logger.error(cp.stderr);
      return undefined;
    }
  }

  async generateMediaPosterFile(media: Media) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    // 计算缩略图路径
    const posterFileName = 'poster.png';
    const posterFilePath = path.join(GENERATED_DIR, media.id, posterFileName);
    await fs.ensureDir(path.join(GENERATED_DIR, media.id));

    const cp = await execa(
      this.options.ffmpegPath,
      ['-y', '-i', `"${media.file.path}"`, '-threads 2', '-ss 00:00:01.000', '-vframes 1', `"${posterFilePath}"`],
      {
        shell: true,
        timeout: 60000,
        reject: false,
      },
    );
    if (await fs.exists(posterFilePath)) {
      await this.fileService.compressImage(posterFilePath);
      const fileStat = await fs.stat(posterFilePath);
      return await this.fileService.save({
        filename: posterFileName,
        name: posterFileName,
        size: fileStat.size,
        md5: await generateMD5(fs.createReadStream(posterFilePath)),
        mimetype: 'image/png',
        source: FileSourceEnum.AUTO_GENERATED,
        path: posterFilePath,
      });
    } else {
      this.logger.error(cp.stderr);
    }

    return undefined;
  }

  async generateMediaFiles(media: Media) {
    const posterFile = await this.generateMediaPosterFile(media);
    if (posterFile) {
      await this.mediaService.save({
        id: media.id,
        poster: { id: posterFile.id },
      });
    }

    const metadata = await this.generateMediaMetadata(media);
    if (metadata) {
      await this.mediaService.save({
        id: media.id,
        metadata: JSON.stringify(metadata),
      });
    }
  }
}
