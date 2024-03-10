import { Inject, Injectable } from '@nestjs/common';
import { NotificationModuleOptions } from '../../notification.module.interface.js';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from '../../notification.module-definition.js';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { NotificationEventMap } from '../../notification-event.interface.js';
import path from 'node:path';
import { isDefined } from 'class-validator';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { fileURLToPath } from 'node:url';
import { NotificationServiceAdapter } from '../../notification-service-adapter.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../../../enums/index.js';
import { User } from '../../../user/user.entity.js';
import { EmailConfig } from './email.config.js';
import { generateMD5 } from '../../../../utils/generate-md5.util.js';
import { EmailVerifyCache } from './email-verify-cache.interface.js';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { compileTemplate } from '../../../../utils/compile-template.util.js';
import { TEMPLATE_DIR } from '../../../../constants.js';

@Injectable()
export class EmailAdapter implements NotificationServiceAdapter<EmailConfig> {
  private transporter: Transporter;

  private logger = new ApplicationLogger(EmailAdapter.name);

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
  ) {}

  adapterServiceType = NotificationServiceEnum.EMAIL;

  adapterConfigType() {
    return EmailConfig;
  }

  isEnabled() {
    return this.options.emailEnabled;
  }

  async init() {
    this.transporter = createTransport({
      host: this.options.emailSmtpHost,
      port: this.options.emailSmtpPort,
      secure: this.options.emailSmtpSecure,
      auth: {
        user: this.options.emailSmtpUser,
        pass: this.options.emailSmtpPassword,
      },
      pool: true,
    });

    try {
      await this.transporter.verify();
      this.logger.log(
        `Email notification service is running, nodemailer version=${this.transporter.getVersionString()}`,
      );
    } catch (error) {
      this.logger.error('Email notification service connect SMTP failed', error.stack, EmailAdapter.name);
    }
  }

  async sendMail(options: SendMailOptions) {
    if (!this.transporter) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(
        {
          ...options,
          subject: options.subject ?? this.options.emailSubject,
          from: options.from ?? this.options.emailOrigin ?? this.options.emailSmtpUser,
        },
        (error, info) => {
          if (error) {
            reject(error);
            this.logger.error('Send mail error', error.stack, EmailAdapter.name);
          }
          resolve(info);
        },
      );
    });
  }

  async sendVerifyEmail(address: string, user: User) {
    const key = await generateMD5(address);
    const token = `email:${key}`;
    if (await this.cacheStore.get(token)) {
      const cache = await this.cacheStore.get<EmailVerifyCache>(token);
      if (Date.now() - cache.lastSendTimestamp < 60 * 1000) {
        return key;
      }
    }

    const code = Math.round(Math.random() * (999999 - 100000) + 100000).toString();
    await this.notify('verify-code', { code }, user.id, { address });
    await this.cacheStore.set<EmailVerifyCache>(
      token,
      {
        userId: user.id,
        email: address,
        code,
        lastSendTimestamp: Date.now(),
        secureTimes: 5,
      },
      30 * 60 * 1000,
    );

    return key;
  }

  async verifyEmail(key: string, predicate: (cache: EmailVerifyCache) => boolean | Promise<boolean>) {
    const token = `email:${key}`;
    const cache = await this.cacheStore.get<EmailVerifyCache>(token);

    if (!cache) {
      return undefined;
    }

    const valid = await predicate(cache);
    if (!valid) {
      cache.secureTimes--;
      if (cache.secureTimes > 0) {
        await this.cacheStore.set(token, cache, 30 * 60 * 1000);
      } else {
        await this.cacheStore.del(token);
      }

      return undefined;
    }

    return cache;
  }

  async notify(event: 'verify-code', data: { code: string }, userId: number, config: EmailConfig): Promise<any>;
  async notify<T extends NotificationEventEnum>(
    event: T,
    data: NotificationEventMap[T],
    userId: number,
    config: EmailConfig,
  ): Promise<any>;
  async notify(event: string, data: object, _userId: number, config: EmailConfig) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templateFn = await compileTemplate(`${event}.handlebars`, [
      path.join(TEMPLATE_DIR, this.adapterServiceType),
      path.join(__dirname, 'templates'),
    ]);

    if (!isDefined(templateFn)) {
      this.logger.warn(`No handlebars template found for event: ${event}`);
      return;
    }

    return await this.sendMail({
      html: templateFn(data),
      to: config.address,
    });
  }
}
