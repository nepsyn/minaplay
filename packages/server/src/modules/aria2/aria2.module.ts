import { Module } from '@nestjs/common';
import { Aria2Service } from './aria2.service.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { Aria2ConfigurableModule } from './aria2.module-definition.js';
import { FileModule } from '../file/file.module.js';

@Module({
  imports: [AuthorizationModule, UserModule, FileModule],
  controllers: [],
  providers: [Aria2Service],
  exports: [Aria2Service],
})
export class Aria2Module extends Aria2ConfigurableModule {
  declare static register: typeof Aria2ConfigurableModule.register;
  declare static registerAsync: typeof Aria2ConfigurableModule.registerAsync;
}
