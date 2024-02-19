import { MinaPlayCommandMetadata, MinaPlayMessageListenerInterceptor } from './plugin.interface.js';
import { Command, CommanderError } from 'commander';
import { COMMAND_ARGUMENTS_TOKEN, COMMAND_OPTIONS_TOKEN } from './constants.js';
import { Text } from '../../common/messages/index.js';
import { buildPluginCommand } from '../../utils/build-plugin-command.js';

export function PluginCommandInterceptor(metadata: MinaPlayCommandMetadata): MinaPlayMessageListenerInterceptor {
  return async (ctx, message, next) => {
    // check message type
    if (message.type !== 'Text') {
      return next.end();
    }

    // find handler Command node
    const argv = message.content.trim().split(/\s+/);
    let root = ctx.control.commands;
    let target: MinaPlayCommandMetadata | undefined = undefined;
    let program: Command | undefined = undefined;
    for (const arg of argv.concat()) {
      const commandMetadata = root.find(({ bin, aliases }) => bin === arg || aliases?.includes(arg));
      if (commandMetadata) {
        if (!program) {
          program = buildPluginCommand(commandMetadata);
        } else {
          program = program.commands.find((command) => command.name() === arg || command.aliases().includes(arg));
        }
        target = commandMetadata;
        root = commandMetadata.subcommands;
        argv.shift();
      } else {
        break;
      }
    }
    if (!program || target?.handler !== metadata?.handler) {
      return next.end();
    }

    // parse args
    try {
      program.parse(argv, { from: 'user' });
      const opts = Object.assign({}, program.opts());
      const args = program.processedArgs.concat();
      return next.handle({
        provides: [
          {
            provide: Command,
            useValue: program,
          },
          ...Object.keys(opts).map((key) => ({
            provide: `${COMMAND_OPTIONS_TOKEN}:${key}`,
            useValue: opts[key],
          })),
          ...args.map((value, index) => ({
            provide: `${COMMAND_ARGUMENTS_TOKEN}:${index}`,
            useValue: value,
          })),
        ],
      });
    } catch (error) {
      if (error instanceof CommanderError) {
        if (['commander.help', 'commander.helpDisplayed'].includes(error.code)) {
          return next.end(new Text(program.helpInformation()));
        } else {
          return next.end(new Text(error.message, Text.Colors.ERROR));
        }
      }
    }
  };
}
