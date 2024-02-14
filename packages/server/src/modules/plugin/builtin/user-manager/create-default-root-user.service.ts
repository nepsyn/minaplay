import { ConsoleLogger, Injectable } from '@nestjs/common';
import { MinaPlayPluginHooks } from '../../plugin.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../user/user.entity.js';
import { Repository } from 'typeorm';
import { Permission } from '../../../authorization/permission.entity.js';
import { PermissionEnum } from '../../../../enums/permission.enum.js';
import { randomBytes } from 'node:crypto';
import { encryptPassword } from '../../../../utils/encrypt-password.util.js';
import UserManagerPlugin from './user-manager.plugin.js';

@Injectable()
export class CreateDefaultRootUserService implements MinaPlayPluginHooks {
  private logger = new ConsoleLogger(UserManagerPlugin.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async onPluginInit() {
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
