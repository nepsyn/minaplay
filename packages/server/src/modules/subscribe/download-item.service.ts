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
        error: 'Application restart',
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
    const item = await this.downloadItemRepository.findOneBy(where);
    if (item?.gid) {
      try {
        item.info = await this.aria2Service.tellStatus(item.gid);
      } catch {}
    }
    return item;
  }

  async findAndCount(options?: FindManyOptions<DownloadItem>) {
    const [result, total] = await this.downloadItemRepository.findAndCount(options);
    for (const item of result) {
      if (item.gid) {
        try {
          item.info = await this.aria2Service.tellStatus(item.gid);
        } catch (error) {}
      }
    }
    return [result, total] as const;
  }

  async delete(where: FindOptionsWhere<DownloadItem>) {
    const items = await this.downloadItemRepository.find({ where });
    for (const item of items) {
      await this.downloadItemRepository.delete({ id: item.id });
      if (item.gid) {
        try {
          await this.aria2Service.removeBy(item.gid);
        } catch {}
      }
    }

    return items.length > 0;
  }
}
