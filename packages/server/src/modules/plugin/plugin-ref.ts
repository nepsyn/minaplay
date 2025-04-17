import { Inject, Injectable } from '@nestjs/common';
import { type PluginService } from './plugin.service.js';
import { MINAPLAY_PLUGIN_ID_TOKEN, PLUGIN_SERVICE_TOKEN } from './constants.js';

@Injectable()
export class PluginRef {
  constructor(
    @Inject(PLUGIN_SERVICE_TOKEN) private pluginService: PluginService,
    @Inject(MINAPLAY_PLUGIN_ID_TOKEN) private id: string,
  ) {
    if (!this.control) {
      throw new Error(`Cannot access PluginRef outside a plugin context`);
    }
  }

  private get control() {
    return this.pluginService.getControlById(this.id);
  }

  get isEnabled() {
    return this.control.enabled;
  }

  get metadata() {
    return this.control.metadata;
  }
}
