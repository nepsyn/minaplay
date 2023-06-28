import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscribeRule } from './subscribe-rule.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SubscribeRuleService {
  constructor(@InjectRepository(SubscribeRule) private subscribeRuleRepository: Repository<SubscribeRule>) {}

  async save(rule: DeepPartial<SubscribeRule>) {
    return await this.subscribeRuleRepository.save(rule);
  }

  async findOneBy(where: FindOptionsWhere<SubscribeRule>) {
    return await this.subscribeRuleRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<SubscribeRule>) {
    return await this.subscribeRuleRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<SubscribeRule>) {
    const result = await this.subscribeRuleRepository.delete(where);
    return result.affected > 0;
  }
}
