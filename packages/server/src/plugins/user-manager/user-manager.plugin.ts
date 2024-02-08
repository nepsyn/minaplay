import { MinaPlayPlugin } from '../../modules/plugin/plugin.decorator.js';
import { MINAPLAY_VERSION } from '../../constants.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/user/user.entity.js';
import { Permission } from '../../modules/authorization/permission.entity.js';
import { CreateDefaultRootUserService } from './create-default-root-user.service.js';
import { UserManagerCommand } from './user-manager.command.js';

@MinaPlayPlugin({
  id: 'user-manager',
  version: MINAPLAY_VERSION,
  description: 'Manage users in MinaPlay',
  author: 'MinaPlay',
  repo: 'https://github.com/nepsyn/minaplay',
  license: 'AGPL-3.0',
  imports: [TypeOrmModule.forFeature([User, Permission])],
  providers: [CreateDefaultRootUserService, UserManagerCommand],
})
export default class UserManagerPlugin {}
