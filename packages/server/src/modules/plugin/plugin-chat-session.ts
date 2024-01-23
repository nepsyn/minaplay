import { Socket } from 'socket.io';
import { PluginControl } from './plugin-control.js';
import { MinaPlayMessage, parseMessage, Text } from '../../common/application.message.js';
import { instanceToPlain } from 'class-transformer';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { isString } from 'class-validator';

export class PluginChatSession {
  constructor(private socket: Socket, private control: PluginControl) {}

  async send(messages: string | MinaPlayMessage | MinaPlayMessage[]) {
    if (isString(messages)) {
      messages = [new Text(messages)];
    } else if ('type' in messages) {
      messages = [messages];
    }

    if (messages?.length > 0) {
      this.socket.emit(
        'console',
        instanceToPlain([
          {
            control: this.control,
            messages,
          },
        ]),
      );
    }
  }

  async receive(ttl = 30000): Promise<MinaPlayMessage> {
    return new Promise((resolve, reject) => {
      const onMessage = (message: MinaPlayMessage) => {
        this.socket.off('console', onMessage);
        clearTimeout(timeout);

        message = parseMessage(message);
        if (message) {
          resolve(message);
        } else {
          reject(new BadRequestException());
        }
      };
      const timeout =
        ttl > 0
          ? setTimeout(() => {
              this.socket.off('console', onMessage);
              reject(new RequestTimeoutException());
            }, ttl)
          : undefined;
      this.socket.on('console', onMessage);
    });
  }
}
