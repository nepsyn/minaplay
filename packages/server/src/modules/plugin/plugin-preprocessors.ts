import { MinaPlayCommandMetadata, MinaPlayMessagePreprocessor } from './plugin.interface.js';
import {
  COMMAND_ARGUMENTS_TOKEN,
  COMMAND_OPTIONS_TOKEN,
  MESSAGE_TOKEN,
  PROGRAM_ROOT_TOKEN,
  PROGRAM_TOKEN,
} from './constants.js';
import { Command, CommanderError } from 'commander';
import { MinaPlayMessage, Text } from '../../common/application.message.js';
import { ValueProvider } from '@nestjs/common';
import { PluginChatContext } from './plugin-chat-context.js';

export function PluginCommandPreprocessor(command: Command): MinaPlayMessagePreprocessor {
  return {
    injects: [MESSAGE_TOKEN, PROGRAM_ROOT_TOKEN, PluginChatContext],
    async factory(message: MinaPlayMessage, root: Map<string, MinaPlayCommandMetadata>, context: PluginChatContext) {
      const providers: ValueProvider[] = [];

      // check message type
      if (message.type !== 'Text') {
        return;
      }

      // find handler Command node
      let metadata: MinaPlayCommandMetadata | undefined = undefined;
      const argv = message.content.split(/\s+/);
      for (const arg of argv.concat()) {
        if (root.has(arg)) {
          metadata = root.get(arg);
          root = root.get(arg).subcommands;
          argv.shift();
        } else {
          break;
        }
      }
      if (!metadata || metadata.program !== command) {
        providers.push(
          {
            provide: PROGRAM_TOKEN,
            useValue: undefined,
          },
          {
            provide: CommanderError,
            useValue: undefined,
          },
        );
        return providers;
      }

      // parse args
      try {
        const program = metadata.program.parse(argv, { from: 'user' });
        const opts = Object.assign({}, program.opts());
        const args = program.processedArgs.concat();
        providers.push(
          {
            provide: COMMAND_OPTIONS_TOKEN,
            useValue: opts,
          },
          {
            provide: COMMAND_ARGUMENTS_TOKEN,
            useValue: args,
          },
          {
            provide: CommanderError,
            useValue: undefined,
          },
          ...Object.keys(opts).map((key) => ({
            provide: `${COMMAND_OPTIONS_TOKEN}:${key}`,
            useValue: opts[key],
          })),
          ...args.map((value, index) => ({
            provide: `${COMMAND_ARGUMENTS_TOKEN}:${index}`,
            useValue: value,
          })),
        );
      } catch (error) {
        if (error instanceof CommanderError) {
          if (['commander.help', 'commander.helpDisplayed'].includes(error.code)) {
            await context.send(new Text(metadata.program.helpInformation()));
          } else {
            await context.send(new Text(error.message, '#B00020'));
          }
        }
        providers.push({
          provide: CommanderError,
          useValue: error,
        });
      } finally {
        providers.push({
          provide: PROGRAM_TOKEN,
          useValue: metadata.program,
        });
      }

      return providers;
    },
  };
}
