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
import { compileTemplate } from '../../../../utils/compile-template.util.js';
import { TEMPLATE_DIR } from '../../../../constants.js';

@Injectable()
export class EmailAdapter implements NotificationServiceAdapter<EmailConfig> {
  private transporter: Transporter;

  private logger = new ApplicationLogger(EmailAdapter.name);

  constructor(@Inject(NOTIFICATION_MODULE_OPTIONS_TOKEN) private options: NotificationModuleOptions) {}

  adapterServiceType = NotificationServiceEnum.EMAIL;

  adapterConfigType = EmailConfig;

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

  async test(user: User, config: EmailConfig) {
    return await this.sendMail({
      html: `Hello ${user.username}, this is a message from MinaPlay notification service!`,
      to: config.address,
    });
  }
}
