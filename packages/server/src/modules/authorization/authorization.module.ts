import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './permission.entity.js';
import { AuthorizationService } from './authorization.service.js';
import { AuthorizationController } from './authorization.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module.js';
import { ActionLog } from './action-log.entity.js';
import { ActionLogService } from './action-log.service.js';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('APP_SECRET_KEY'),
          signOptions: {
            expiresIn: '4 Weeks',
          },
        };
      },
    }),
    PassportModule,
    TypeOrmModule.forFeature([Permission, ActionLog]),
  ],
  providers: [AuthorizationService, ActionLogService, JwtStrategy],
  controllers: [AuthorizationController],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
