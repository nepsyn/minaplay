import { Module } from '@nestjs/common';
import { Aria2Service } from './aria2.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { Aria2ConfigurableModule } from './aria2.module-definition';
import { FileModule } from '../file/file.module';

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
