import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthorizationModule],
  providers: [UserService],
  controllers: [],
  exports: [UserService],
})
export class UserModule {}
