import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { UserController } from './user.controller.js';
import { FileModule } from '../file/file.module.js';
import { UserEntitySubscriber } from './user.entity.subscriber.js';

@Module({
  imports: [FileModule, TypeOrmModule.forFeature([User])],
  providers: [UserService, UserEntitySubscriber],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
