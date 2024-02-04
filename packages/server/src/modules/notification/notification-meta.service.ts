import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationMeta } from './notification-meta.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class NotificationMetaService {
  constructor(@InjectRepository(NotificationMeta) private notificationMetaRepository: Repository<NotificationMeta>) {}

  async save(meta: DeepPartial<NotificationMeta>) {
    return await this.notificationMetaRepository.save(meta);
  }

  async findOneBy(where: FindOptionsWhere<NotificationMeta>) {
    return await this.notificationMetaRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<NotificationMeta>) {
    return await this.notificationMetaRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<NotificationMeta>) {
    const result = await this.notificationMetaRepository.delete(where);
    return result.affected > 0;
  }
}
