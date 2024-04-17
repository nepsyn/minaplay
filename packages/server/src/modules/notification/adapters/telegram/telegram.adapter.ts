import { NotificationServiceAdapter } from '../../notification-service-adapter.interface.js';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { Inject } from '@nestjs/common';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from '../../notification.module-definition.js';
import { NotificationModuleOptions } from '../../notification.module.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../../../enums/index.js';
import { NotificationEventMap } from '../../notification-event.interface.js';
import { fileURLToPath } from 'node:url';
import { compileTemplate } from '../../../../utils/compile-template.util.js';
import { TEMPLATE_DIR } from '../../../../constants.js';
import { isDefined } from 'class-validator';
import { TelegramConfig } from './telegram.config.js';
import path from 'node:path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export class TelegramAdapter implements NotificationServiceAdapter<TelegramConfig> {
  private logger = new ApplicationLogger(TelegramAdapter.name);

  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions) {}

  adapterServiceType = NotificationServiceEnum.TELEGRAM;

  adapterConfigType() {
    return TelegramConfig;
  }

  isEnabled() {
    return this.options.telegramEnabled;
  }

  init() {
    this.logger.log('Telegram notification service is running');
  }

  async notify<T extends NotificationEventEnum>(
    event: T,
    data: NotificationEventMap[T],
    _userId: number,
    config: TelegramConfig,
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

    const text = templateFn(data);
    const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: 'POST',
      agent: this.options.httpProxy && new HttpsProxyAgent(this.options.httpProxy),
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        caption: text,
        disable_notification: true,
      }),
    });

    return response.ok;
  }
}
