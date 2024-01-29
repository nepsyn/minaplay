import { PluginControl } from './plugin-control.js';
import { MinaPlayMessage, Text } from '../../common/application.message.js';
import { InjectionToken, RequestTimeoutException } from '@nestjs/common';
import { isString } from 'class-validator';
import { TypedEventEmitter } from '../../utils/typed-event-emitter.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import {
  MinaPlayMessageListenerMetadata,
  MinaPlayMessagePreprocessor,
  MinaPlayMessageValidator,
  MinaPlayParamMetadata,
} from './plugin.interface.js';
import { User } from '../user/user.entity.js';
import { MESSAGE_TOKEN, PROGRAM_ROOT_TOKEN } from './constants.js';

export type PluginChatContextEventMap = {
  send: (messages: MinaPlayMessage[]) => any;
  receive: (message: MinaPlayMessage) => any;
};

export class PluginChatContext extends TypedEventEmitter<PluginChatContextEventMap> {
  private context = `Plugin(${this.control.id})`;
  private logger = new ApplicationLogger(this.context);
  private container: Map<InjectionToken, any> = new Map();
  private blocking = false;

  constructor(public readonly user: User, public readonly control: PluginControl) {
    super();

    this.container.set(User, user);
    this.container.set(PluginControl, control);
    this.container.set(PluginChatContext, this);
    this.container.set(PROGRAM_ROOT_TOKEN, control.commands);
  }

  private async createListenerRuntimeParams(
    metadata: MinaPlayMessageListenerMetadata,
    container: Map<InjectionToken, any>,
  ) {
    const params = [];
    for (const { index, token } of metadata.params) {
      if (container.has(token)) {
        params[index] = container.get(token);
      } else {
        try {
          params[index] = this.control.module.get(token);
        } catch {
          this.logger.error(
            `Unable to resolve dependency type on ${metadata.type.name}#${String(metadata.key)} at index ${index}`,
          );
        }
      }
    }
    return params;
  }

  private async createMiddlewareRuntimeParams(
    metadata: MinaPlayMessageListenerMetadata,
    container: Map<InjectionToken, any>,
    middleware: MinaPlayMessagePreprocessor | MinaPlayMessageValidator,
    middlewareIndex: number,
    type: 'preprocessors' | 'validators',
  ) {
    const params = [];
    const tokens: MinaPlayParamMetadata[] = (middleware.injects ?? []).map((value, index) => ({ index, token: value }));
    for (const { index, token } of tokens) {
      if (container.has(token)) {
        params[index] = container.get(token);
      } else {
        try {
          params[index] = this.control.module.get(token);
        } catch {
          this.logger.error(
            `Unable to resolve dependency type of ` +
              `${metadata.type.name}#${String(metadata.key)} ${type}[${middlewareIndex}] at index ${index}`,
          );
        }
      }
    }
    return params;
  }

  async handleMessage(message: MinaPlayMessage) {
    if (this.blocking) {
      this.emit('receive', message);
    } else {
      this.container.set(MESSAGE_TOKEN, message);
      for (const metadata of this.control.listeners) {
        const container = await this.preprocessListener(metadata);
        const valid = await this.validateListener(metadata, container);
        if (valid) {
          const result = await this.emitListener(metadata, container);
          await this.send(result);
          return;
        }
      }
    }
  }

  private async preprocessListener(metadata: MinaPlayMessageListenerMetadata) {
    const container = new Map(this.container.entries());
    for (const [index, preprocessor] of metadata.preprocessors.entries()) {
      try {
        const params = await this.createMiddlewareRuntimeParams(
          metadata,
          this.container,
          preprocessor,
          index,
          'preprocessors',
        );
        const providers = (await preprocessor.factory(...params)) ?? [];
        for (const provider of providers) {
          if (!container.has(provider.provide)) {
            container.set(provider.provide, provider.useValue);
          }
        }
      } catch (error) {
        this.logger.error(
          `Error occurred while running preprocessor of ` +
            `${metadata.type.name}#${String(metadata.key)} at index ${index}`,
          error.stack,
          this.context,
        );
      }
    }
    return container;
  }

  private async validateListener(metadata: MinaPlayMessageListenerMetadata, container: Map<InjectionToken, any>) {
    for (const [index, validator] of metadata.validators.entries()) {
      try {
        const params = await this.createMiddlewareRuntimeParams(metadata, container, validator, index, 'validators');
        const valid = await validator.factory(...params);
        if (!valid) {
          return false;
        }
      } catch (error) {
        this.logger.error(
          `Error occurred while running validator of ` +
            `${metadata.type.name}#${String(metadata.key)} at index ${index}`,
          error.stack,
          this.context,
        );
        return false;
      }
    }

    return true;
  }

  private async emitListener(
    metadata: MinaPlayMessageListenerMetadata,
    container: Map<InjectionToken, any>,
  ): Promise<string | MinaPlayMessage | MinaPlayMessage[] | undefined> {
    this.blocking = true;
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
    } finally {
      this.blocking = false;
    }
  }

  async send(messages: string | MinaPlayMessage | MinaPlayMessage[]) {
    if (isString(messages)) {
      messages = [new Text(messages)];
    } else if ('type' in messages) {
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
