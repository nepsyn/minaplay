import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { SystemService } from './system.service.js';
import { SystemController } from './system.controller.js';

@Module({
  imports: [FileModule, AuthorizationModule],
  providers: [SystemService],
  controllers: [SystemController],
  exports: [SystemService],
})
export class SystemModule {}
