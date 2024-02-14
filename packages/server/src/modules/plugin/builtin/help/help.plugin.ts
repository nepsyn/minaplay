import { MinaPlayPlugin } from '../../plugin.decorator.js';
import { MINAPLAY_VERSION } from '../../../../constants.js';
import { HelpCommand } from './help.command.js';

@MinaPlayPlugin({
  id: 'help',
  version: MINAPLAY_VERSION,
  description: 'Show helps in MinaPlay plugin console',
  author: 'MinaPlay',
  repo: 'https://github.com/nepsyn/minaplay',
  license: 'AGPL-3.0',
  imports: [],
  providers: [HelpCommand],
})
export default class HelpPlugin {}
