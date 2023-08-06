import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadItem } from './download-item.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';

@Injectable()
export class DownloadItemService implements OnModuleInit {
  constructor(@InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>) {}

  async onModuleInit() {
    await this.downloadItemRepository.update(
      {
        status: SubscribeDownloadItemStatusEnum.DOWNLOADING,
      },
      {
        status: SubscribeDownloadItemStatusEnum.FAILED,
      },
    );
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
}
