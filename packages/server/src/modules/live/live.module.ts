import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Live } from './live.entity';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { LiveConfigurableModule } from './live.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Live])],
  providers: [LiveService],
  controllers: [LiveController],
  exports: [LiveService],
})
export class LiveModule extends LiveConfigurableModule {
  declare static register: typeof LiveConfigurableModule.register;
  declare static registerAsync: typeof LiveConfigurableModule.registerAsync;
}
