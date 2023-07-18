import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { MediaModuleOptions } from './media.module.interface';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import fs from 'fs-extra';
import { GENERATED_IMAGE_DIR, GENERATED_METADATA_DIR, GENERATED_SUBTITLE_DIR } from '../../constants';
import path from 'node:path';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';
import type Execa from 'execa';
import { importDynamic } from '../../utils/import-dynamic.util';
import { MediaMetadata } from '../../interfaces/media.metadata';
import { File } from '../file/file.entity';

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
    const posterFileName = `${media.file.name}.png`;
    const posterFilePath = path.join(GENERATED_IMAGE_DIR, media.id, posterFileName);
    await fs.ensureDir(path.join(GENERATED_IMAGE_DIR, media.id));

    try {
      await execa(
        this.options.ffmpegPath,
        [`-i`, media.file.path, '-threads 2', '-ss 00:00:01.000', '-vframes 1', posterFilePath],
        {
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
      this.logger.debug(`poster file '${file.id}' created for media '${media.id}'`);

      return file;
    } catch {
      this.logger.error(`poster file create failed for media '${media.id}'`);
    }
  }

  async generateMediaMetadataFile(media: Media) {
    const execa: typeof Execa.execa = (await importDynamic('execa')).execa;

    // 计算缩略图路径
    const metadataFileName = `${media.file.name}.json`;
    const metadataFilePath = path.join(GENERATED_METADATA_DIR, media.id, metadataFileName);
    await fs.ensureDir(path.join(GENERATED_METADATA_DIR, media.id));

    try {
      const cp = await execa(
        this.options.ffprobePath,
        [`-i`, media.file.path, '-v quiet', '-print_format json', '-show_format', '-show_streams'],
        {
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
      this.logger.debug(`metadata file '${file.id}' created for media '${media.id}'`);

      return file;
    } catch {
      this.logger.error(`metadata file create failed for media '${media.id}'`);
    }
  }

  async generateMediaSubtitleFiles(media: Media, metadata: MediaMetadata) {
    const execa: typeof Execa.execa = (await importDynamic('execa')).execa;

    const subtitles = metadata.streams.filter((s) => s.codec_type === 'subtitle');
    const files: File[] = [];

    try {
      for (const [index, subtitle] of subtitles.entries()) {
        const subtitleFileName = `${media.file.name}.${subtitle.tags.title ?? index}.ass`;
        const subtitleFilePath = path.join(GENERATED_SUBTITLE_DIR, media.id, subtitleFileName);
        await fs.ensureDir(path.join(GENERATED_SUBTITLE_DIR, media.id));

        await execa(this.options.ffmpegPath, [`-i`, media.file.path, '-map', `0:s:${index}`, subtitleFilePath], {
          shell: true,
          timeout: 5000,
        });

        const fileStat = await fs.stat(subtitleFilePath);
        const file = await this.fileService.save({
          filename: subtitleFileName,
          name: subtitleFileName,
          size: fileStat.size,
          md5: await generateMD5(fs.createReadStream(subtitleFilePath)),
          source: FileSourceEnum.AUTO_GENERATED,
          path: subtitleFilePath,
        });
        files.push(file);
      }
      this.logger.debug(`subtitle files created for media '${media.id}'`);

      return files;
    } catch {
      this.logger.error(`subtitle files create failed for media '${media.id}'`);
    }
  }

  async generateMediaFiles(media: Media) {
    const posterFile = await this.generateMediaPosterFile(media);
    if (posterFile) {
      await this.mediaService.save({
        id: media.id,
        poster: { id: posterFile.id },
      });
    }

    const metadataFile = await this.generateMediaMetadataFile(media);
    if (metadataFile) {
      await this.mediaService.save({
        id: media.id,
        metadata: { id: metadataFile.id },
      });

      const metadata: MediaMetadata = await fs.readJson(metadataFile.path);
      const subtitleFiles = await this.generateMediaSubtitleFiles(media, metadata);
      await this.mediaService.save({
        id: media.id,
        subtitles: subtitleFiles.filter(({ id }) => ({ id })),
      });
    }
  }
}
