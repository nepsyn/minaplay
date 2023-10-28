import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async save(user: DeepPartial<User>) {
    return await this.userRepository.save(user);
  }

  async findOneBy(where: FindOptionsWhere<User>) {
    return await this.userRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<User>) {
    return await this.userRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<User>) {
    const result = await this.userRepository.delete(where);
    return result.affected > 0;
  }
}
