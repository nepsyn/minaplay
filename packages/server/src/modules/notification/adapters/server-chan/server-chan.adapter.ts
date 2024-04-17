import { NotificationServiceAdapter } from '../../notification-service-adapter.interface.js';
import { ServerChanConfig } from './server-chan.config.js';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { Inject } from '@nestjs/common';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from '../../notification.module-definition.js';
import { NotificationModuleOptions } from '../../notification.module.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../../../enums/index.js';
import { NotificationEventMap } from '../../notification-event.interface.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileTemplate } from '../../../../utils/compile-template.util.js';
import { TEMPLATE_DIR } from '../../../../constants.js';
import { isDefined } from 'class-validator';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ServerChanAdapter implements NotificationServiceAdapter<ServerChanConfig> {
  private logger = new ApplicationLogger(ServerChanAdapter.name);

  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions) {}

  adapterServiceType = NotificationServiceEnum.SERVER_CHAN;

  adapterConfigType() {
    return ServerChanConfig;
  }

  isEnabled() {
    return this.options.serverChanEnabled;
  }

  init() {
    this.logger.log('ServerChan notification service is running');
  }

  async notify<T extends NotificationEventEnum>(
    event: T,
    data: NotificationEventMap[T],
    _userId: number,
    config: ServerChanConfig,
  ) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templateFn = await compileTemplate(`${event}.handlebars`, [
      path.join(TEMPLATE_DIR, this.adapterServiceType),
      path.join(__dirname, 'templates'),
    ]);

    if (!isDefined(templateFn)) {
      this.logger.warn(`No handlebars template found for event: ${event}`);
      return;
    }

    const response = await fetch(`https://sctapi.ftqq.com/${config.token}.send`, {
      method: 'POST',
      agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'MinaPlay ServerChan Notification',
        desp: templateFn(data),
        noip: true,
      }),
    });

    return response.ok;
  }
}
