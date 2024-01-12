import { Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { LiveChat } from './live-chat.entity.js';
import { Live } from './live.entity.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LiveChatService {
  constructor(@InjectRepository(LiveChat) private chatRepository: Repository<LiveChat>) {}

  async save(chat: DeepPartial<LiveChat>) {
    return await this.chatRepository.save(chat);
  }

  async findAndCount(options: FindManyOptions<LiveChat>) {
    return await this.chatRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Live>) {
    const result = await this.chatRepository.delete(where);
    return result.affected > 0;
  }
}
