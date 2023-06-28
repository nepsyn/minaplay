import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscribeFetchError } from './subscribe-fetch-error.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class SubscribeFetchErrorService {
  constructor(
    @InjectRepository(SubscribeFetchError) private subscribeParseLogRepository: Repository<SubscribeFetchError>,
  ) {}

  async save(log: DeepPartial<SubscribeFetchError>) {
    return await this.subscribeParseLogRepository.save(log);
  }

  async findOneBy(where: FindOptionsWhere<SubscribeFetchError>) {
    return await this.subscribeParseLogRepository.findOneBy(where);
  }
}
