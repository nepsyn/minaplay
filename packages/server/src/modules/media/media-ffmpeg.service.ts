import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { MediaModuleOptions } from './media.module.interface';
import { MEDIA_MODULE_OPTIONS_TOKEN } from './media.module-definition';
import { MediaService } from './media.service';
import { spawn } from 'child_process';
import { Media } from './media.entity';
import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import { USER_UPLOAD_IMAGE_DIR } from '../../constants';
import path from 'node:path';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';

@Injectable()
export class MediaFfmpegService {
  private logger = new ConsoleLogger(MediaFfmpegService.name);

  constructor(
    @Inject(MEDIA_MODULE_OPTIONS_TOKEN) private options: MediaModuleOptions,
    private fileService: FileService,
    private mediaService: MediaService,
  ) {}

  private escapePath(path: string) {
    return path.replace(/\\/g, '\\\\');
  }

  async generateMediaPosterFile(media: Media) {
    // 计算缩略图路径
    const posterFileName = randomUUID().replace(/-/g, '') + '.png';
    const posterFilePath = path.join(USER_UPLOAD_IMAGE_DIR, posterFileName);
    await fs.ensureDir(USER_UPLOAD_IMAGE_DIR);
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
    cp.on('close', async () => {
      if (cp.exitCode === 0 && fs.pathExistsSync(posterFilePath)) {
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
      } else {
        this.logger.error(`poster file create failed for media '${media.id}', exit code: ${cp.exitCode}`);
      }
    });

    return cp;
  }
}
