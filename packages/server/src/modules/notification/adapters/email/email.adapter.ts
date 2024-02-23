import { Inject, Injectable } from '@nestjs/common';
import { NotificationModuleOptions } from '../../notification.module.interface.js';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from '../../notification.module-definition.js';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { NotificationEventMap } from '../../notification-event.interface.js';
import Handlebars from 'handlebars';
import path from 'node:path';
import fs from 'fs-extra';
import { isDefined } from 'class-validator';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { ApplicationLogger } from '../../../../common/application.logger.service.js';
import { fileURLToPath } from 'node:url';
import { NotificationServiceAdapter } from '../../notification-service-adapter.interface.js';
import { NotificationEventEnum, NotificationServiceEnum } from '../../../../enums/index.js';
import { User } from '../../../user/user.entity.js';
import { EmailConfig } from './email.config.js';
import { generateMD5 } from '../../../../utils/generate-md5.util.js';
import { EmailVerifyCache } from './email-verify-cache.interface.js';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';

@Injectable()
export class EmailAdapter implements NotificationServiceAdapter<EmailConfig> {
  private transporter: Transporter;
  private templates: Record<NotificationEventEnum | string, Handlebars.TemplateDelegate> = {};

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

  private async compileTemplate(event: NotificationEventEnum | string) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [`${event}.${this.options.appEnv}.handlebars`, `${event}.handlebars`].map((name) =>
      path.join(__dirname, 'templates', name),
    );

    for (const candidate of candidates) {
      if (await fs.exists(candidate)) {
        const code = await fs.readFile(candidate);
        return Handlebars.compile(code.toString());
      }
    }

    return null;
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
    if (isUndefined(this.templates[event])) {
      this.templates[event] = await this.compileTemplate(event);
    }

    if (!isDefined(this.templates[event])) {
      this.logger.warn(`No handlebars template found for event: ${event}`);
      return;
    }

    return await this.sendMail({
      html: this.templates[event](data),
      to: config.address,
    });
  }
}
