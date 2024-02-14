import { Injectable } from '@nestjs/common';
import { PluginService } from '../../modules/plugin/plugin.service.js';
import {
  MinaPlayChatMessage,
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayMessageListener,
} from '../../modules/plugin/plugin.decorator.js';
import { MessageIsType } from '../../modules/plugin/plugin-validators.js';
import { PluginControl } from '../../modules/plugin/plugin-control.js';
import { MinaPlayMessage } from '../../common/application.message.js';
import { Text } from '../../common/messages/text.js';
import { ConsumableGroup } from '../../common/messages/consumable-group.js';
import { Action } from '../../common/messages/action.js';
import { ConsumableFeedback } from '../../common/messages/consumable-feedback.js';
import { Command } from 'commander';

@Injectable()
export class HelpCommand {
  constructor(private pluginService: PluginService) {}

  private getPrograms() {
    const programs: { bin: string; control: PluginControl; program: Command; description: string }[] = [];
    for (const control of this.pluginService.enabledPluginControls) {
      for (const [bin, command] of control.commands) {
        programs.push({
          bin,
          control,
          program: command.program,
          description: command.program.description(),
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
          ({ bin, control, description }) =>
            new Text(`${bin.padEnd(20, ' ')}[plugin:${control.id}] - ${description}\n`),
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
    description: 'show commands in MinaPlay plugin console',
  })
  async handleHelp(@MinaPlayCommandArgument('[bin]') bin?: string) {
    if (bin) {
      const programs = this.getPrograms().filter((program) => program.bin === bin);
      if (programs.length > 0) {
        return programs.map(
          ({ bin, control, program, description }) =>
            new Text(`${bin.padEnd(20, ' ')}[from:${control.id}] - ${description}\n${program.helpInformation()}`),
        );
      } else {
        return new Text(`error: unknown command '${bin}'`, Text.Colors.ERROR);
      }
    } else {
      return this.buildHelpPage(0);
    }
  }

  @MinaPlayMessageListener({
    validators: [MessageIsType(ConsumableFeedback)],
  })
  async handleHelpOnPage(@MinaPlayChatMessage() message: ConsumableFeedback) {
    if (message.id.startsWith('help-page')) {
      const page = Number(message.value);
      return this.buildHelpPage(page);
    }
  }
}
