import { ConsoleLogger, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { File } from './file.entity';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';

@Injectable()
export class FileService implements OnModuleInit {
  private logger = new ConsoleLogger(FileService.name);

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
    this.scheduleRegistry.addCronJob('auto-clean-files', job);
  }

  private async cleanExpiredFiles() {
    await this.delete({
      expireAt: LessThanOrEqual(new Date()),
    });
  }

  async save(file: DeepPartial<File>) {
    return await this.fileRepository.save(file);
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
      try {
        await fs.unlink(file.path);
      } catch (error) {
        this.logger.error(`Delete file '${file.id}' error`, error.stack);
      }

      try {
        const files = await fs.readdir(path.dirname(file.path));
        if (files.length === 0) {
          await fs.rmdir(path.dirname(file.path));
        }
      } catch (error) {
        this.logger.error(`Delete empty dir '${path.dirname(file.path)}' error`, error.stack);
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
