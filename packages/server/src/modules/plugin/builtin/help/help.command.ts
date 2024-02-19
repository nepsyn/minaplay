import { Injectable } from '@nestjs/common';
import { PluginService } from '../../plugin.service.js';
import {
  MinaPlayChatMessage,
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayMessageListener,
} from '../../plugin.decorator.js';
import { PluginControl } from '../../plugin-control.js';
import { MinaPlayMessage } from '../../../../common/application.message.js';
import { Text } from '../../../../common/messages/text.js';
import { ConsumableFeedback, ConsumableGroup } from '../../../../common/messages/index.js';
import { Action } from '../../../../common/messages/action.js';
import { Command } from 'commander';
import { buildPluginCommand } from '../../../../utils/build-plugin-command.js';

@Injectable()
export class HelpCommand {
  constructor(private pluginService: PluginService) {}

  private getPrograms() {
    const programs: { bin: string; control: PluginControl; program: Command; description: string }[] = [];
    for (const control of this.pluginService.enabledPluginControls) {
      for (const metadata of control.commands) {
        const program = buildPluginCommand(metadata);
        programs.push({
          bin: metadata.bin,
          control,
          program,
          description: program.description(),
        });
      }
    }
    return programs.sort((a, b) => (a.bin.toLowerCase() < b.bin.toLowerCase() ? -1 : 1));
  }

  private buildHelpPage(page: number, size = 10): MinaPlayMessage[] {
    const programs = this.getPrograms();
    const pagedPrograms = programs.slice(size * page, size * (page + 1));
    const messages: MinaPlayMessage[] = [
      new Text(`Page ${page + 1} of ${Math.ceil(programs.length / size)}\n`, Text.Colors.INFO),
    ];
    if (pagedPrograms.length > 0) {
      messages.push(
        ...pagedPrograms.map(
          ({ bin, control, description }) => new Text(`${bin.padEnd(20, ' ')}[${control.id}] - ${description}\n`),
        ),
      );
    } else {
      messages.push(new Text('No commands in this page'));
    }
    if (page > 0 || size * page < programs.length) {
      const group = new ConsumableGroup(`help-page-${Date.now().toString()}`, []);
      if (page > 0) {
        group.items.push(new Action(String(page - 1), new Text('⬅ Prev Page')));
      }
      if (size * (page + 1) < programs.length) {
        group.items.push(new Action(String(page + 1), new Text('Next Page ➡')));
      }
      messages.push(group);
    }
    return messages;
  }

  @MinaPlayCommand('help', {
    aliases: ['man'],
    description: 'show commands in MinaPlay plugin console',
  })
  async handleHelp(@MinaPlayCommandArgument('[bin]') bin?: string) {
    if (bin) {
      const programs = this.getPrograms().filter((program) => program.bin === bin);
      if (programs.length > 0) {
        return programs.map(
          ({ bin, control, program, description }) =>
            new Text(`${bin.padEnd(20, ' ')}[${control.id}] - ${description}\n${program.helpInformation()}`),
        );
      } else {
        return new Text(`error: unknown command '${bin}'`, Text.Colors.ERROR);
      }
    } else {
      return this.buildHelpPage(0);
    }
  }

  @MinaPlayMessageListener({
    interceptors: [
      (_ctx, message, next) => {
        if (message.type === 'ConsumableFeedback' && message.id.startsWith('help-page')) {
          return next.handle();
        } else {
          return next.end();
        }
      },
    ],
  })
  async handleHelpOnPage(@MinaPlayChatMessage() message: ConsumableFeedback) {
    return this.buildHelpPage(Number(message.value));
  }
}
