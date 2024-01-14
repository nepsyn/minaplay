import { MinaPlayPlugin } from '../../common/plugin.decorator.js';
import { MINAPLAY_VERSION } from '../../constants.js';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/user/user.entity.js';
import { Repository } from 'typeorm';
import { Permission } from '../../modules/authorization/permission.entity.js';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { MinaPlayPluginHooks } from '../../interfaces/plugins.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { randomBytes } from 'node:crypto';
import { encryptPassword } from '../../utils/encrypt-password.util.js';

@Injectable()
class CreateDefaultRootUserService implements MinaPlayPluginHooks {
  private logger = new ConsoleLogger(CreateDefaultRootUserPlugin.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async onEnabled() {
    const rootUserCount = await this.permissionRepository.countBy({
      name: PermissionEnum.ROOT_OP,
    });
    if (rootUserCount === 0) {
      const username = 'minaplay';
      const password = randomBytes(4).toString('hex');
      const { id: userId } = await this.userRepository.save({
        username,
        password: await encryptPassword(password),
      });
      await this.permissionRepository.save({
        userId,
        name: PermissionEnum.ROOT_OP,
      });
      this.logger.log(`Default root user created, username: ${username}, password: ${password}`);
    }
  }
}

@MinaPlayPlugin({
  id: 'create-default-root-user',
  version: MINAPLAY_VERSION,
  description: 'Create default root user if there is no root user in the system',
  author: 'MinaPlay',
  repo: 'https://github.com/nepsyn/minaplay',
  imports: [TypeOrmModule.forFeature([User, Permission])],
  providers: [CreateDefaultRootUserService],
})
export default class CreateDefaultRootUserPlugin {}
