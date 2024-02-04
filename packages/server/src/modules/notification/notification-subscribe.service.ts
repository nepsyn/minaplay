import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSubscribe } from './notification-subscribe.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class NotificationSubscribeService {
  constructor(
    @InjectRepository(NotificationSubscribe) private notificationSubscribeRepository: Repository<NotificationSubscribe>,
  ) {}

  async save(event: DeepPartial<NotificationSubscribe>) {
    return await this.notificationSubscribeRepository.save(event);
  }

  async findOneBy(where: FindOptionsWhere<NotificationSubscribe>) {
    return await this.notificationSubscribeRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<NotificationSubscribe>) {
    return await this.notificationSubscribeRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<NotificationSubscribe>) {
    const result = await this.notificationSubscribeRepository.delete(where);
    return result.affected > 0;
  }
}
