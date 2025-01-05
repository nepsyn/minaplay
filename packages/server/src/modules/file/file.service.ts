import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { File } from './file.entity.js';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'node:path';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { generateMD5 } from '../../utils/generate-md5.util.js';
import { FileSourceEnum } from '../../enums/index.js';
import { isDefined } from 'class-validator';

@Injectable()
export class FileService implements OnModuleInit {
  private logger = new ApplicationLogger(FileService.name);

  constructor(
    @InjectRepository(File) private fileRepository: Repository<File>,
    private scheduleRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const job = CronJob.from({
      cronTime: CronExpression.EVERY_HOUR,
      onTick: async () => {
        await this.cleanExpiredFiles();
      },
      runOnInit: true,
    });
    this.scheduleRegistry.addCronJob('auto-clean-files', job as any);
  }

  private async cleanExpiredFiles() {
    await this.delete({
      expireAt: LessThanOrEqual(new Date()),
    });
  }

  async save(file: DeepPartial<File>, ignoreDuplicated = false) {
    if (!ignoreDuplicated && isDefined(file.size) && isDefined(file.md5)) {
      const localFile = await this.fileRepository.findOneBy({ md5: file.md5, size: file.size });
      if (localFile) {
        file = {
          ...file,
          id: localFile.id,
        };
      }
    }

    return await this.fileRepository.save(file);
  }

  async saveLocalFile(filepath: string, source = FileSourceEnum.LOCAL) {
    const stat = await fs.stat(filepath);
    if (!stat.isFile()) {
      throw new Error('Invalid file type');
    }

    return await this.save({
      filename: path.basename(filepath),
      name: path.basename(filepath),
      size: stat.size,
      md5: await generateMD5(fs.createReadStream(filepath)),
      source,
      path: filepath,
    });
  }

  async findOneBy(where: FindOptionsWhere<File>) {
    return await this.fileRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<File>) {
    return await this.fileRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<File>) {
    const files = await this.fileRepository.find({ where });
    for (const file of files) {
      await this.fileRepository.delete({ id: file.id });
      if (file.source !== FileSourceEnum.NETWORK) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          this.logger.error(`Delete file '${file.id}' error`, error.stack, FileService.name);
        }

        try {
          const files = await fs.readdir(path.dirname(file.path));
          if (files.length === 0) {
            await fs.rmdir(path.dirname(file.path));
          }
        } catch (error) {
          this.logger.error(`Delete empty dir '${path.dirname(file.path)}' error`, error.stack, FileService.name);
        }
      }
    }

    return files.length > 0;
  }

  async compressImage(path: string, quality: number = 40) {
    const sp = sharp(path);
    const metadata = await sp.metadata();
    const buffer = await sp[metadata.format]({ quality }).toBuffer(path);
    await fs.writeFile(path, buffer);
  }
}
