import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rule } from './rule.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class RuleService {
  constructor(@InjectRepository(Rule) private ruleRepository: Repository<Rule>) {}

  async save(rule: DeepPartial<Rule>) {
    return await this.ruleRepository.save(rule);
  }

  async findOneBy(where: FindOptionsWhere<Rule>) {
    return await this.ruleRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Rule>) {
    return await this.ruleRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Rule>) {
    const result = await this.ruleRepository.delete(where);
    return result.affected > 0;
  }
}
