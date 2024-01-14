import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParseLog } from './parse-log.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class ParseLogService {
  constructor(@InjectRepository(ParseLog) private parseLogRepository: Repository<ParseLog>) {}

  async save(log: DeepPartial<ParseLog>) {
    return await this.parseLogRepository.save(log);
  }

  async findOneBy(where: FindOptionsWhere<ParseLog>) {
    return await this.parseLogRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<ParseLog>) {
    return await this.parseLogRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<ParseLog>) {
    const result = await this.parseLogRepository.delete(where);
    return result.affected > 0;
  }
}
