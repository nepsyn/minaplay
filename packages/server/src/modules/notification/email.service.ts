import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationModuleOptions } from './notification.module.interface';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from './notification.module-definition';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { NotificationEventMap, NotificationEventType } from './notification-events.interface';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs-extra';
import { isDefined } from 'class-validator';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { ApplicationLogger } from '../../common/application.logger.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;
  private templates: Record<NotificationEventType | string, Handlebars.TemplateDelegate> = {};

  private logger = new ApplicationLogger(EmailService.name);

  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions) {}

  async onModuleInit() {
    if (this.options.emailEnabled) {
      this.transporter = createTransport({
        host: this.options.smtpHost,
        port: this.options.smtpPort,
        secure: this.options.smtpSecure,
        auth: {
          user: this.options.smtpUser,
          pass: this.options.smtpPassword,
        },
        pool: true,
      });

      try {
        await this.transporter.verify();
        this.logger.log(`Email service is running, nodemailer version=${this.transporter.getVersionString()}`);
      } catch (error) {
        this.logger.error('Email service connect SMTP failed', error.stack, EmailService.name);
      }
    }
  }

  private async compileTemplate(event: NotificationEventType | string) {
    const candidates = [`${event}.${this.options.appEnv}.handlebars`, `${event}.handlebars`].map((name) =>
      path.join(__dirname, '../../../templates', name),
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
    if (!this.options.emailEnabled || !this.transporter) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(
        {
          ...options,
          subject: options.subject ?? this.options.emailSubject,
          from: options.from ?? this.options.emailOrigin ?? this.options.smtpUser,
        },
        (error, info) => {
          if (error) {
            reject(error);
            this.logger.error('Send mail error', error.stack, EmailService.name);
          }
          resolve(info);
        },
      );
    });
  }

  async notify(event: 'verify-code', data: { code: string }, to: string | string[]): Promise<void>;
  async notify<T extends NotificationEventType>(
    event: T,
    data: NotificationEventMap[T],
    to: string | string[],
  ): Promise<void>;
  async notify(event: string, data: object, to: string | string[]) {
    if (isUndefined(this.templates[event])) {
      this.templates[event] = await this.compileTemplate(event);
    }

    if (!isDefined(this.templates[event])) {
      this.logger.error(`No handlebars template found for event: ${event}`);
      return;
    }

    return await this.sendMail({
      html: this.templates[event](data),
      to,
    });
  }
}
