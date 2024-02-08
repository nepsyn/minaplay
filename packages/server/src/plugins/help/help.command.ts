import { Injectable } from '@nestjs/common';
import { PluginService } from '../../modules/plugin/plugin.service.js';
import {
  MinaPlayChatMessage,
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayMessageListener,
} from '../../modules/plugin/plugin.decorator.js';
import { MessageIsType } from '../../modules/plugin/plugin-validators.js';
import { ActionGroup, Feedback, MinaPlayMessage, Option, Text } from '../../common/application.message.js';
import { PluginControl } from '../../modules/plugin/plugin-control.js';

@Injectable()
export class HelpCommand {
  constructor(private pluginService: PluginService) {}

  private getPrograms() {
    const programs: { bin: string; control: PluginControl; description: string }[] = [];
    for (const control of this.pluginService.enabledPluginControls) {
      for (const [bin, command] of control.commands) {
        programs.push({
          bin,
          control: control,
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
      new Text(`Page ${page + 1} of ${Math.ceil(programs.length / size)}`),
      new Text('\n'),
    ];
    if (pagedPrograms.length > 0) {
      messages.push(
        ...pagedPrograms.map(
          ({ bin, control, description }) => new Text(`${bin.padEnd(20, ' ')}[plugin:${control.id}] - ${description}`),
        ),
      );
    } else {
      messages.push(new Text('No commands in this page'));
    }
    if (page > 0 || size * page < programs.length) {
      const group = new ActionGroup(`help-page-${Date.now().toString()}`, []);
      if (page > 0) {
        group.options.push(new Option(String(page - 1), new Text('⬅ Prev Page')));
      }
      if (size * (page + 1) < programs.length) {
        group.options.push(new Option(String(page + 1), new Text('Next Page ➡')));
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
          ({ bin, control, description }) => new Text(`${bin.padEnd(20, ' ')}[from:${control.id}] - ${description}`),
        );
      } else {
        return new Text(`error: unknown command '${bin}'`, '#B00020');
      }
    } else {
      return this.buildHelpPage(0);
    }
  }

  @MinaPlayMessageListener({
    validators: [MessageIsType(Feedback)],
  })
  async handleHelpOnPage(@MinaPlayChatMessage() message: Feedback) {
    if (message.groupId.startsWith('help-page')) {
      const page = Number(message.optionId);
      return this.buildHelpPage(page);
    }
  }
}
