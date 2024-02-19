import { PluginControl } from './plugin-control.js';
import { MinaPlayMessage } from '../../common/application.message.js';
import { InjectionToken, RequestTimeoutException } from '@nestjs/common';
import { isDefined, isString } from 'class-validator';
import { TypedEventEmitter } from '../../utils/typed-event-emitter.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { MinaPlayCallHandler, MinaPlayListenerResult, MinaPlayMessageListenerMetadata } from './plugin.interface.js';
import { User } from '../user/user.entity.js';
import { MESSAGE_TOKEN } from './constants.js';
import { Text } from '../../common/messages/text.js';
import { defer, finalize, lastValueFrom, mergeAll, Observable, of, switchMap } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

export type PluginListenerContextEventMap = {
  send: (messages: MinaPlayMessage[]) => any;
  receive: (message: MinaPlayMessage) => any;
};

export class PluginChat {
  constructor(private readonly context: PluginListenerContext) {}

  send: PluginListenerContext['send'] = this.context.send.bind(this.context);

  receive: PluginListenerContext['receive'] = this.context.receive.bind(this.context);
}

export class PluginListenerContext extends TypedEventEmitter<PluginListenerContextEventMap> {
  private context = `Plugin(${this.control.id})`;
  private logger = new ApplicationLogger(this.context);
  private blocking = false;

  constructor(public readonly user: User, public readonly control: PluginControl) {
    super();
  }

  private async createListenerRuntimeParams(
    metadata: MinaPlayMessageListenerMetadata,
    container: Map<InjectionToken, any>,
  ) {
    const params = [];
    for (const { index, param } of metadata.params) {
      try {
        params[index] = container.has(param) ? container.get(param) : this.control.module.get(param);
      } catch {
        this.logger.error(
          `Unable to resolve dependency type on ${metadata.type.name}#${String(metadata.key)} at index ${index}`,
        );
      }
    }
    return params;
  }

  async handleMessage(message: MinaPlayMessage) {
    if (this.blocking) {
      this.emit('receive', message);
      return;
    }

    for (const metadata of this.control.listeners) {
      const container: Map<InjectionToken, any> = new Map();
      container.set(MESSAGE_TOKEN, message);
      container.set(User, this.user);
      container.set(PluginChat, new PluginChat(this));

      const nextFn = async (i = 0) => {
        if (i >= metadata.interceptors.length) {
          this.blocking = true;
          return defer(() =>
            fromPromise(this.emitListener(metadata, container)).pipe(
              switchMap((res) => {
                const isDeferred = res instanceof Promise || res instanceof Observable;
                return isDeferred ? res : Promise.resolve(res);
              }),
            ),
          ).pipe(
            finalize(() => {
              this.blocking = false;
            }),
          );
        }
        const handler: MinaPlayCallHandler = {
          handle: (options) => {
            for (const { provide, useValue } of options?.provides ?? []) {
              container.set(provide, useValue);
            }
            return fromPromise(nextFn(i + 1)).pipe(mergeAll());
          },
          end: (message?: MinaPlayListenerResult) => {
            return of(message);
          },
        };
        return metadata.interceptors[i](this, message, handler);
      };

      const observable = defer(() => nextFn()).pipe(mergeAll());
      const result = await lastValueFrom(observable);
      await this.send(result);
    }
  }

  async emitListener(
    metadata: MinaPlayMessageListenerMetadata,
    container: Map<InjectionToken, any>,
  ): Promise<MinaPlayListenerResult> {
    try {
      const service = this.control.module.get(metadata.type);
      const params = await this.createListenerRuntimeParams(metadata, container);
      return await service[metadata.key](...params);
    } catch (error) {
      this.logger.error(
        `Error occurred while running message listener ${this.control.type.name}#${String(metadata.key)}`,
        error.stack,
        this.context,
      );
    }
  }

  async send(messages: MinaPlayListenerResult) {
    if (isString(messages)) {
      messages = [new Text(messages)];
    } else if (isDefined(messages) && 'type' in messages) {
      messages = [messages];
    }

    if (messages?.length > 0) {
      this.emit('send', messages);
    }
  }

  async receive(ttl = 30000): Promise<MinaPlayMessage> {
    return new Promise((resolve, reject) => {
      const onMessage = (message: MinaPlayMessage) => {
        clearTimeout(timeout);
        resolve(message);
      };
      const timeout =
        ttl > 0
          ? setTimeout(() => {
              this.off('receive', onMessage);
              reject(new RequestTimeoutException());
            }, ttl)
          : undefined;
      this.once('receive', onMessage);
    });
  }
}
