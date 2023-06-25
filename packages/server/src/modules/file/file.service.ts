import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { File } from './file.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { access, constants, unlink } from 'fs-extra';

@Injectable()
export class FileService {
  private logger = new ConsoleLogger(FileService.name);

  constructor(
    @InjectRepository(File) private fileRepository: Repository<File>,
    private scheduleRegistry: SchedulerRegistry,
  ) {}

  async save(file: DeepPartial<File>) {
    const record = this.fileRepository.create(await this.fileRepository.save(file));
    if (record.expireAt && !record.isExpired) {
      const name = `delete-file-${record.id}`;
      this.scheduleRegistry.deleteCronJob(name);

      const job = new CronJob(file.expireAt as Date, async () => {
        try {
          await access(record.path, constants.W_OK);
          await unlink(record.path);
        } catch (error) {
          this.logger.error(`Delete local expired file failed with uuid: ${record.id}`);
          if (error.stack) {
            this.logger.error(error.stack);
          }
        }
      });
      this.scheduleRegistry.addCronJob(name, job);
    }

    return record;
  }

  async findOneBy(where: FindOptionsWhere<File>) {
    return await this.fileRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<File>) {
    return await this.fileRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<File>) {
    const result = await this.fileRepository.delete(where);
    return result.affected > 0;
  }
}
