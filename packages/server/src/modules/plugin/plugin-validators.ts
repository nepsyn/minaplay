import { MinaPlayMessageValidator } from './plugin.interface.js';
import { MESSAGE_TOKEN, PROGRAM_TOKEN } from './constants.js';
import { Command, CommanderError } from 'commander';
import { isDefined, isString } from 'class-validator';
import { MinaPlayMessage, MinaPlayMessageType } from '../../common/application.message.js';
import { Type } from '@nestjs/common';

export function PluginCommandValidator(): MinaPlayMessageValidator {
  return {
    injects: [PROGRAM_TOKEN, CommanderError],
    factory(command: Command, error: CommanderError) {
      return isDefined(command) && !isDefined(error);
    },
  };
}

export function ValidatorNot(validator: MinaPlayMessageValidator): MinaPlayMessageValidator {
  return {
    injects: validator.injects,
    async factory(...args) {
      return !(await validator.factory(...args));
    },
  };
}

export function ValidatorOr(...validators: MinaPlayMessageValidator[]): MinaPlayMessageValidator {
  const injects = validators.flatMap(({ injects }) => injects ?? []);
  return {
    injects,
    async factory(...args) {
      for (const validator of validators) {
        const valid = await validator.factory(...args.splice(0, validator.injects?.length ?? 0));
        if (valid) {
          return true;
        }
      }
      return false;
    },
  };
}

export function MessageIsType(type: MinaPlayMessageType | Type<MinaPlayMessage>): MinaPlayMessageValidator {
  return {
    injects: [MESSAGE_TOKEN],
    factory(message: MinaPlayMessage) {
      return isString(type) ? message.type === type : message instanceof type;
    },
  };
}

export function TextMessageContains(text: string, ignoreCase = false): MinaPlayMessageValidator {
  return {
    injects: [MESSAGE_TOKEN],
    factory(message: MinaPlayMessage) {
      if (message.type !== 'Text') {
        return false;
      }

      return ignoreCase ? message.content.toLowerCase().includes(text.toLowerCase()) : message.content.includes(text);
    },
  };
}

export function TextMessageMatch(regexp: RegExp): MinaPlayMessageValidator {
  return {
    injects: [MESSAGE_TOKEN],
    factory(message: MinaPlayMessage) {
      if (message.type !== 'Text') {
        return false;
      }

      return regexp.test(message.content);
    },
  };
}
