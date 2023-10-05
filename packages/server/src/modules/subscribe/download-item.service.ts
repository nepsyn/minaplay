import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadItem } from './download-item.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { Aria2Service } from '../aria2/aria2.service';

@Injectable()
export class DownloadItemService implements OnModuleInit {
  constructor(
    @InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>,
    private aria2Service: Aria2Service,
  ) {}

  async onModuleInit() {
    await this.downloadItemRepository.update(
      {
        status: StatusEnum.PENDING,
      },
      {
        status: StatusEnum.FAILED,
      },
    );
  }

  async addDownloadItemTask(url: string, props: DeepPartial<DownloadItem>) {
    const task = await this.aria2Service.addTask(url);
    const item = await this.save({
      ...props,
      gid: task.gid,
      status: StatusEnum.PENDING,
    });
    task.on('complete', async () => {
      await this.save({
        id: item.id,
        status: StatusEnum.SUCCESS,
      });
    });
    task.on('error', async (status) => {
      await this.save({
        id: item.id,
        status: StatusEnum.FAILED,
        error: status.errorMessage,
      });
    });

    return [task, item] as const;
  }

  async save(item: DeepPartial<DownloadItem>) {
    return await this.downloadItemRepository.save(item);
  }

  async findOneBy(where: FindOptionsWhere<DownloadItem>) {
    return await this.downloadItemRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<DownloadItem>) {
    return await this.downloadItemRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<DownloadItem>) {
    return await this.downloadItemRepository.delete(where);
  }
}
