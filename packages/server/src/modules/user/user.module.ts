import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { FileModule } from '../file/file.module';
import { UserEntitySubscriber } from './user.entity.subscriber';

@Module({
  imports: [FileModule, TypeOrmModule.forFeature([User])],
  providers: [UserService, UserEntitySubscriber],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
