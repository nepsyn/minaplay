import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadItem } from './download-item.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class DownloadItemService {
  constructor(@InjectRepository(DownloadItem) private downloadItemRepository: Repository<DownloadItem>) {}

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
