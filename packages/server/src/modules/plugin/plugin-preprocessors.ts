import { MinaPlayCommandMetadata, MinaPlayMessagePreprocessor } from './plugin.interface.js';
import { COMMAND_ARGUMENTS_TOKEN, COMMAND_OPTIONS_TOKEN, MESSAGE_TOKEN, PROGRAM_ROOT_TOKEN } from './constants.js';
import { Command, CommanderError } from 'commander';
import { MinaPlayMessage } from '../../common/application.message.js';
import { ValueProvider } from '@nestjs/common';
import { PluginChatContext } from './plugin-chat-context.js';
import { Text } from '../../common/messages/text.js';

export function PluginCommandPreprocessor(command: Command): MinaPlayMessagePreprocessor {
  return {
    injects: [MESSAGE_TOKEN, PROGRAM_ROOT_TOKEN, PluginChatContext],
    async factory(message: MinaPlayMessage, root: Map<string, MinaPlayCommandMetadata>, context: PluginChatContext) {
      const providers: ValueProvider[] = [
        {
          provide: Command,
          useValue: undefined,
        },
        {
          provide: CommanderError,
          useValue: undefined,
        },
      ];

      // check message type
      if (message.type !== 'Text') {
        return providers;
      }

      // find handler Command node
      let metadata: MinaPlayCommandMetadata | undefined = undefined;
      let program: Command | undefined = undefined;
      const argv = message.content.trim().split(/\s+/);
      for (const arg of argv.concat()) {
        if (root.has(arg)) {
          metadata = root.get(arg);
          const command = metadata.programFactory();
          program?.addCommand(command);
          program = command;
          root = root.get(arg).subcommands;
          argv.shift();
        } else {
          break;
        }
      }
      if (!metadata || metadata.program !== command) {
        return providers;
      }

      // parse args
      try {
        program.parse(argv, { from: 'user' });
        const opts = Object.assign({}, program.opts());
        const args = program.processedArgs.concat();
        return [
          {
            provide: Command,
            useValue: program,
          },
          {
            provide: CommanderError,
            useValue: undefined,
          },
          {
            provide: COMMAND_OPTIONS_TOKEN,
            useValue: opts,
          },
          {
            provide: COMMAND_ARGUMENTS_TOKEN,
            useValue: args,
          },
          ...Object.keys(opts).map((key) => ({
            provide: `${COMMAND_OPTIONS_TOKEN}:${key}`,
            useValue: opts[key],
          })),
          ...args.map((value, index) => ({
            provide: `${COMMAND_ARGUMENTS_TOKEN}:${index}`,
            useValue: value,
          })),
        ];
      } catch (error) {
        if (error instanceof CommanderError) {
          if (['commander.help', 'commander.helpDisplayed'].includes(error.code)) {
            await context.send(new Text(metadata.program.helpInformation()));
          } else {
            await context.send(new Text(error.message, Text.Colors.ERROR));
          }
        }

        return [
          {
            provide: Command,
            useValue: program,
          },
          {
            provide: CommanderError,
            useValue: error,
          },
        ];
      }
    },
  };
}
