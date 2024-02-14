import { MinaPlayPlugin } from '../../plugin.decorator.js';
import { MINAPLAY_VERSION } from '../../../../constants.js';
import { PluginManagerCommand } from './plugin-manager.command.js';

@MinaPlayPlugin({
  id: 'plugin-manager',
  version: MINAPLAY_VERSION,
  description: 'Manage plugins in MinaPlay',
  author: 'MinaPlay',
  repo: 'https://github.com/nepsyn/minaplay',
  license: 'AGPL-3.0',
  imports: [],
  providers: [PluginManagerCommand],
})
export class PluginManagerPlugin {}
