import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { RuleErrorLog } from './rule-error-log.entity';

@Injectable()
export class RuleErrorLogService {
  constructor(@InjectRepository(RuleErrorLog) private ruleErrorLogRepository: Repository<RuleErrorLog>) {}

  async save(log: DeepPartial<RuleErrorLog>) {
    return await this.ruleErrorLogRepository.save(log);
  }

  async findOneBy(where: FindOptionsWhere<RuleErrorLog>) {
    return await this.ruleErrorLogRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<RuleErrorLog>) {
    return await this.ruleErrorLogRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<RuleErrorLog>) {
    const result = await this.ruleErrorLogRepository.delete(where);
    return result.affected > 0;
  }
}
