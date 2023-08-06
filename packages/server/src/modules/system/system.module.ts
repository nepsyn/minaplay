import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
  imports: [FileModule, AuthorizationModule],
  providers: [SystemService],
  controllers: [SystemController],
  exports: [SystemService],
})
export class SystemModule {}
