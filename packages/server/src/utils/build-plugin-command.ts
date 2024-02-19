import { MinaPlayCommandMetadata } from '../modules/index.js';
import { Command } from 'commander';

export function buildPluginCommand(metadata: MinaPlayCommandMetadata): Command {
  const command = metadata.commandFactory();
  for (const subcommandMetadata of metadata.subcommands) {
    command.addCommand(buildPluginCommand(subcommandMetadata));
  }
  return command;
}
