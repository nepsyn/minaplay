import { Injectable } from '@nestjs/common';
import { NotificationEventMap, NotificationEventType } from './notification-events.interface';
import { User } from '../user/user.entity';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(private emailService: EmailService, private notificationGateway: NotificationGateway) {}

  async notify<T extends NotificationEventType>(event: T, data: NotificationEventMap[T], to: User | User[]) {
    const users: User[] = [].concat(to);
    if (users.length > 0) {
      await this.emailService.notify(
        event,
        data,
        users.filter((user) => user.email && user.notify).map((user) => user.email),
      );
      await this.notificationGateway.notify(
        event,
        data,
        users.map((user) => user.id.toString()),
      );
    }
  }
}
