import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async save(user: DeepPartial<User>) {
    return this.userRepository.create(await this.userRepository.save(user));
  }

  async findOneBy(where: FindOptionsWhere<User>) {
    return this.userRepository.findOneBy(where);
  }

  async update(where: FindOptionsWhere<User>, data: DeepPartial<User>) {
    const result = await this.userRepository.update(where, data);
    return result.affected > 0;
  }
}
