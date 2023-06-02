import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class LiveService {
  constructor(@InjectRepository(Live) private liveRepository: Repository<Live>) {}

  async save(live: DeepPartial<Live>) {
    return this.liveRepository.create(await this.liveRepository.save(live));
  }

  async findOneBy(where: FindOptionsWhere<Live>) {
    return await this.liveRepository.findOneBy(where);
  }

  async delete(where: FindOptionsWhere<Live>) {
    const result = await this.liveRepository.delete(where);
    return result.affected > 0;
  }
}
