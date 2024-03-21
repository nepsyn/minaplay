import { ConsoleLogger, Injectable } from '@nestjs/common';
import { MinaPlayPluginHooks } from '../../plugin.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../user/user.entity.js';
import { Repository } from 'typeorm';
import { Permission } from '../../../authorization/permission.entity.js';
import { PermissionEnum } from '../../../../enums/index.js';
import { randomBytes } from 'node:crypto';
import { encryptPassword } from '../../../../utils/encrypt-password.util.js';
import UserManagerPlugin from './user-manager.plugin.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DefaultRootUserService implements MinaPlayPluginHooks {
  private logger = new ConsoleLogger(UserManagerPlugin.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
    private configService: ConfigService,
  ) {}

  static DefaultUsername = 'minaplay';

  async onPluginInit() {
    if (this.configService.get('APP_ROOT_USER_RESET')) {
      await this.resetDefaultRootUser();
    } else {
      const rootUserCount = await this.permissionRepository.countBy({
        name: PermissionEnum.ROOT_OP,
      });
      if (rootUserCount === 0) {
        await this.createDefaultUser();
      }
    }
  }

  async createDefaultUser() {
    const password = randomBytes(4).toString('hex');
    const { id: userId } = await this.userRepository.save({
      username: DefaultRootUserService.DefaultUsername,
      password: await encryptPassword(password),
    });
    await this.permissionRepository.save({
      userId,
      name: PermissionEnum.ROOT_OP,
    });
    this.logger.log(
      `Default root user created, username: ${DefaultRootUserService.DefaultUsername}, password: ${password}`,
    );
  }

  async resetDefaultRootUser() {
    const defaultRootUser = await this.userRepository.findOneBy({
      username: DefaultRootUserService.DefaultUsername,
    });
    if (!defaultRootUser) {
      await this.createDefaultUser();
    } else {
      const password = randomBytes(4).toString('hex');
      await this.userRepository.save({
        id: defaultRootUser.id,
        password: await encryptPassword(password),
      });
      await this.permissionRepository.delete({ userId: defaultRootUser.id });
      await this.permissionRepository.save({
        userId: defaultRootUser.id,
        name: PermissionEnum.ROOT_OP,
      });
      this.logger.log(`Default root user reset, username: ${defaultRootUser.username}, password: ${password}`);
    }
  }
}
