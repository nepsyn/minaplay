import { ConsoleLogger, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationModuleOptions } from './notification.module.interface';
import { NOTIFICATION_MODULE_OPTIONS_TOKEN } from './notification.module-definition';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { NotificationEventMap, NotificationEventType } from './notification-events.interface';
import Handlebars from 'handlebars';
import path from 'path';
import process from 'process';
import fs from 'fs-extra';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;
  private templates: Record<NotificationEventType | string, Handlebars.TemplateDelegate> = {};

  private logger = new ConsoleLogger(EmailService.name);

  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions) {}

  async onModuleInit() {
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
      this.logger.error('Email service connect SMTP failed', error.stack);
    }
  }

  private async compileTemplate(event: NotificationEventType | string) {
    const candidates = [`${event}.handlebars`, `${event}.${this.options.appEnv}.handlebars`].map((name) =>
      path.join(process.cwd(), 'templates', name),
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
            this.logger.error('Send mail error: ', error.stack);
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
    if (this.templates[event] === undefined) {
      this.templates[event] = await this.compileTemplate(event);
    }

    if (this.templates[event] === null) {
      this.logger.error(`No handlebars template found for event: ${event}`);
      return;
    }

    return await this.sendMail({
      html: this.templates[event](data),
      to,
    });
  }
}
