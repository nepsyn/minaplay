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
    const { execa } = await importESM<typeof import('execa')>('execa');

    // 计算缩略图路径
    const posterFileName = 'poster.png';
    const posterFilePath = path.join(GENERATED_DIR, media.id, posterFileName);
    await fs.ensureDir(path.join(GENERATED_DIR, media.id));

    const cp = await execa(
      this.options.ffmpegPath,
      [
        '-y',
        '-v quiet',
        '-i',
        `"${media.file.path}"`,
        '-threads 2',
        '-ss 00:00:01.000',
        '-vframes 1',
        `"${posterFilePath}"`,
      ],
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

  async generateMediaMetadataFile(media: Media) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    // 计算缩略图路径
    const metadataFileName = 'metadata.json';
    const metadataFilePath = path.join(GENERATED_DIR, media.id, metadataFileName);
    await fs.ensureDir(path.join(GENERATED_DIR, media.id));

    const cp = await execa(
      this.options.ffprobePath,
      ['-v quiet', '-i', `"${media.file.path}"`, '-print_format json', '-show_streams'],
      {
        shell: true,
        timeout: 60000,
        reject: false,
      },
    );
    await fs.writeFile(metadataFilePath, cp.stdout);
    if (await fs.exists(metadataFilePath)) {
      const fileStat = await fs.stat(metadataFilePath);
      return await this.fileService.save({
        filename: metadataFileName,
        name: metadataFileName,
        size: fileStat.size,
        md5: await generateMD5(fs.createReadStream(metadataFilePath)),
        mimetype: 'application/json',
        source: FileSourceEnum.AUTO_GENERATED,
        path: metadataFilePath,
      });
    } else {
      this.logger.error(cp.stderr);
    }

    return undefined;
  }

  async generateMediaSubtitleFiles(media: Media, metadata: MediaMetadata) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    const subtitles = metadata.streams.filter((s) => s.codec_type === 'subtitle');
    const files: File[] = [];

    for (const [index, subtitle] of subtitles.entries()) {
      const subtitleFileName = `${subtitle.tags.title ?? index}.${subtitle.codec_name}`;
      const subtitleFilePath = path.join(GENERATED_DIR, media.id, subtitleFileName);
      await fs.ensureDir(path.join(GENERATED_DIR, media.id));

      const cp = await execa(
        this.options.ffmpegPath,
        ['-y', '-v quiet', '-i', `"${media.file.path}"`, '-map', `0:s:${index}`, `"${subtitleFilePath}"`],
        {
          shell: true,
          timeout: 60000,
          reject: false,
        },
      );
      if (await fs.exists(subtitleFilePath)) {
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
      } else {
        this.logger.error(cp.stderr);
      }
    }

    return files;
  }

  async generateMediaAttachmentFiles(media: Media, metadata: MediaMetadata) {
    const { execa } = await importESM<typeof import('execa')>('execa');

    const attachments = metadata.streams.filter((s) => s.codec_type === 'attachment');
    const files: File[] = [];

    for (const [index, attachment] of attachments.entries()) {
      const attachmentFileName = attachment.tags?.filename ?? `${index}.font`;
      const attachmentFilePath = path.join(GENERATED_DIR, media.id, attachmentFileName);
      await fs.ensureDir(path.join(GENERATED_DIR, media.id));

      const cp = await execa(
        this.options.ffmpegPath,
        ['-y', '-v quiet', `-dump_attachment:t:${index}`, `"${attachmentFilePath}"`, '-i', `"${media.file.path}"`],
        {
          shell: true,
          timeout: 60000,
          reject: false,
        },
      );
      if (await fs.exists(attachmentFilePath)) {
        const fileStat = await fs.stat(attachmentFilePath);
        const file = await this.fileService.save({
          filename: attachmentFileName,
          name: attachmentFileName,
          size: fileStat.size,
          md5: await generateMD5(fs.createReadStream(attachmentFilePath)),
          mimetype: attachment.tags?.mimetype,
          source: FileSourceEnum.AUTO_GENERATED,
          path: attachmentFilePath,
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

      const attachmentFiles = await this.generateMediaAttachmentFiles(media, metadata);
      await this.mediaService.save({
        id: media.id,
        attachments: attachmentFiles.map(({ id }) => ({ id })),
      });
    }
  }
}
