import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { ViewHistory } from './view-history.entity';

@Injectable()
export class ViewHistoryService {
  constructor(@InjectRepository(ViewHistory) private viewHistoryRepository: Repository<ViewHistory>) {}

  async save(history: DeepPartial<ViewHistory>) {
    return await this.viewHistoryRepository.save(history);
  }

  async findOneBy(where: FindOptionsWhere<ViewHistory>) {
    return await this.viewHistoryRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<ViewHistory>) {
    return await this.viewHistoryRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<ViewHistory>) {
    const result = await this.viewHistoryRepository.delete(where);
    return result.affected > 0;
  }
}
