import { Inject, Injectable } from '@nestjs/common';
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
import { File } from '../file/file.entity';
import { ApplicationLogger } from '../../common/application.logger.service';

@Injectable()
export class MediaFileService {
  private logger = new ApplicationLogger(MediaFileService.name);

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

  async extractMediaFiles(media: Media, metadata: MediaMetadata) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    const files: File[] = [];
    await fs.ensureDir(path.join(GENERATED_DIR, media.id));

    const subtitles = metadata.streams.filter((s) => s.codec_type === 'subtitle');
    for (const [index, subtitle] of subtitles.entries()) {
      const filename = `${subtitle.tags?.title ?? subtitle.index ?? index}.ass`;
      const filepath = path.join(GENERATED_DIR, media.id, filename);
      const cp = await execa(
        this.options.ffmpegPath,
        ['-y', '-i', `"${media.file.path}"`, '-map', `0:s:${index}`, `"${filepath}"`],
        {
          shell: true,
          timeout: 60000,
          reject: false,
        },
      );
      if (await fs.exists(filepath)) {
        const stat = await fs.stat(filepath);
        const file = await this.fileService.save({
          filename: filename,
          name: filename,
          size: stat.size,
          md5: await generateMD5(fs.createReadStream(filepath)),
          source: FileSourceEnum.AUTO_GENERATED,
          path: filepath,
        });
        files.push(file);
      } else {
        this.logger.error(cp.stderr);
      }
    }

    const attachments = metadata.streams.filter((s) => s.codec_type === 'attachment');
    for (const [index, attachment] of attachments.entries()) {
      const filename = attachment.tags?.filename ?? `${attachment.index ?? index}`;
      const filepath = path.join(GENERATED_DIR, media.id, filename);

      const cp = await execa(
        this.options.ffmpegPath,
        ['-y', `-dump_attachment:t:${index}`, `"${filepath}"`, '-i', `"${media.file.path}"`],
        {
          shell: true,
          timeout: 60000,
          reject: false,
        },
      );
      if (await fs.exists(filepath)) {
        const stat = await fs.stat(filepath);
        const file = await this.fileService.save({
          filename: filename,
          name: filename,
          size: stat.size,
          md5: await generateMD5(fs.createReadStream(filepath)),
          mimetype: attachment.tags?.mimetype,
          source: FileSourceEnum.AUTO_GENERATED,
          path: filepath,
        });
        files.push(file);
      } else {
        this.logger.error(cp.stderr);
      }
    }

    return files;
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
      const attachments = media.attachments.length > 0 ? [] : await this.extractMediaFiles(media, metadata);

      await this.mediaService.save({
        id: media.id,
        metadata: JSON.stringify(metadata),
        attachments: attachments.concat(media.attachments).map(({ id }) => ({ id })),
      });
    }
  }
}
