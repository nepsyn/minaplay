import { MinaPlayMessageValidator } from './plugin.interface.js';
import { PROGRAM_TOKEN } from './constants.js';
import { Command, CommanderError } from 'commander';
import { isDefined } from 'class-validator';
import { PluginChatSession } from './plugin-chat-session.js';
import { Text } from '../../common/application.message.js';

export function PluginCommandValidator(root: Command): MinaPlayMessageValidator {
  return {
    injects: [PROGRAM_TOKEN, CommanderError, PluginChatSession],
    async factory(command: Command, error: CommanderError, chat: PluginChatSession) {
      if (error && root === command) {
        if (['commander.help', 'commander.helpDisplayed'].includes(error.code)) {
          await chat.send(new Text(command.helpInformation()));
        } else {
          await chat.send(new Text(error.message, '#B00020'));
        }
      }

      return isDefined(command) && root === command && !isDefined(error);
    },
  };
}
