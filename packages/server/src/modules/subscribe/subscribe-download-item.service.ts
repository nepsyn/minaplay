import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscribeDownloadItem } from './subscribe-download-item.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SubscribeDownloadItemService {
  constructor(
    @InjectRepository(SubscribeDownloadItem) private subscribeDownloadItemRepository: Repository<SubscribeDownloadItem>,
  ) {}

  async save(item: DeepPartial<SubscribeDownloadItem>) {
    return this.subscribeDownloadItemRepository.create(await this.subscribeDownloadItemRepository.save(item));
  }

  async findOneBy(where: FindOptionsWhere<SubscribeDownloadItem>) {
    return await this.subscribeDownloadItemRepository.findOneBy(where);
  }
}
