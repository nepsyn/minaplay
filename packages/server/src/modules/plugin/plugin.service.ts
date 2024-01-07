import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MinaPlayPluginConstructor, MinaPlayPluginHooks } from '../../interfaces/plugins';
import { PluginControl } from './plugin-control';
import { plainToInstance } from 'class-transformer';
import { getMinaPlayPluginDescriptor } from '../../common/plugin.decorator';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto';
import { ApplicationLogger } from '../../common/application.logger.service';

@Injectable()
export class PluginService implements OnModuleInit {
  private logger = new ApplicationLogger(PluginService.name);
  private controls: PluginControl[] = [];

  constructor(private moduleRef: ModuleRef, @Inject('PLUGINS') private plugins: MinaPlayPluginConstructor[]) {}

  async onModuleInit() {
    for (const attr of this.plugins) {
      const descriptor = getMinaPlayPluginDescriptor(attr);
      try {
        const instance = await this.moduleRef.create(attr);
        this.controls.push(
          plainToInstance(PluginControl, {
            ...descriptor,
            instance,
            type: attr,
            enabled: true,
          }),
        );
        this.logger.log(`Plugin '${descriptor.id}(${descriptor.version ?? 'unknown version'})' created`);
      } catch (error) {
        this.logger.error(`Error occurred while creating plugin instance: '${descriptor.id}'`, error.stack);
      }
    }

    await this.emitAllEnabled('onEnabled');
  }

  async emit<T extends keyof MinaPlayPluginHooks>(
    control: PluginControl,
    hook: T,
    ...args: Parameters<MinaPlayPluginHooks[T]>
  ) {
    try {
      await control.instance[hook].apply(control.instance, args);
    } catch (error) {
      this.logger.error(`Error occurred while invoking hook '${hook}' on plugin '${control.id}'`, error.stack);
    }
  }

  async emitAllEnabled<T extends keyof MinaPlayPluginHooks>(hook: T, ...args: Parameters<MinaPlayPluginHooks[T]>) {
    for (const control of this.controls.filter(({ enabled }) => enabled)) {
      await this.emit(control, hook, ...args);
    }
  }

  async toggleEnabled(id: string, enabled: boolean) {
    const control = this.controls.find((control) => control.id === id);
    if (!control) {
      return undefined;
    }

    if (enabled && !control.enabled) {
      await this.emit(control, 'onEnabled');
    } else if (!enabled && control.enabled) {
      await this.emit(control, 'onDisabled');
    }

    control.enabled = enabled;

    return control;
  }

  getAllControls() {
    return new ApiPaginationResultDto(this.controls, this.controls.length, 0, -1);
  }
}
