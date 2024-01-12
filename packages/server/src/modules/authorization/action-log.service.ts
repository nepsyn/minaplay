import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { ActionLog } from './action-log.entity.js';

@Injectable()
export class ActionLogService {
  constructor(@InjectRepository(ActionLog) private actionLogRepository: Repository<ActionLog>) {}

  async save(log: DeepPartial<ActionLog>) {
    return await this.actionLogRepository.save(log);
  }

  async findOneBy(where: FindOptionsWhere<ActionLog>) {
    return await this.actionLogRepository.findOneBy(where);
  }

  async findAndCount(options: FindManyOptions<ActionLog>) {
    return await this.actionLogRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<ActionLog>) {
    const result = await this.actionLogRepository.delete(where);
    return result.affected > 0;
  }
}
