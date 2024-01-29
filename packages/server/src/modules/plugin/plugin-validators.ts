import { MinaPlayMessageValidator } from './plugin.interface.js';
import { PROGRAM_TOKEN } from './constants.js';
import { Command, CommanderError } from 'commander';
import { isDefined } from 'class-validator';

export function PluginCommandValidator(): MinaPlayMessageValidator {
  return {
    injects: [PROGRAM_TOKEN, CommanderError],
    async factory(command: Command, error: CommanderError) {
      return isDefined(command) && !isDefined(error);
    },
  };
}
