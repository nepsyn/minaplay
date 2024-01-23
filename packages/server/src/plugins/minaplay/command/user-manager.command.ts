import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../modules/user/user.entity.js';
import { Permission } from '../../../modules/authorization/permission.entity.js';
import { Repository } from 'typeorm';
import { isString } from 'class-validator';
import { encryptPassword } from '../../../utils/encrypt-password.util.js';
import { PermissionEnum } from '../../../enums/permission.enum.js';
import { Injectable } from '@nestjs/common';
import { ApplicationLogger } from '../../../common/application.logger.service.js';
import { Command } from 'commander';
import {
  MinaPlayCommand,
  MinaPlayCommandArgument,
  MinaPlayPluginInject,
} from '../../../modules/plugin/plugin.decorator.js';
import { PluginChatSession } from '../../../modules/plugin/plugin-chat-session.js';

@Injectable()
export class UserManagerCommand {
  private logger = new ApplicationLogger(UserManagerCommand.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  @MinaPlayCommand('um')
  async handleUm(@MinaPlayPluginInject() program: Command) {
    return program.helpInformation();
  }

  @MinaPlayCommand('add-root', {
    parents: ['um'],
  })
  async handleAddRootUser(
    @MinaPlayCommandArgument('<username>', {
      description: 'Username of this root user',
    })
    username: string,
    @MinaPlayCommandArgument('<password>', {
      description: 'Password of this root user',
    })
    password: string,
  ) {
    const sameNameUser = await this.userRepository.findOneBy({ username });
    if (sameNameUser) {
      return `Duplicated username '${username}' in database.`;
    }

    if (!isString(password) || password.length < 6 || password.length > 40) {
      return `Password too short`;
    }

    try {
      const { id } = await this.userRepository.save({
        username,
        password: await encryptPassword(password),
      });
      await this.permissionRepository.save({
        userId: id,
        name: PermissionEnum.ROOT_OP,
      });
      return `Root user '${username}' added`;
    } catch (error) {
      this.logger.error(`Root user '${username}' add failed`, error.stack, UserManagerCommand.name);
      return `Root user '${username}' add failed`;
    }
  }

  @MinaPlayCommand('delete', {
    parents: ['um'],
  })
  async handleDeleteUser(
    @MinaPlayCommandArgument('<username>', {
      description: 'Username of this root user',
    })
    username: string,
    @MinaPlayPluginInject() chat: PluginChatSession,
  ) {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      return `User '${username}' not found in database`;
    }

    await chat.send(`Are you sure to delete user '${username}' ? (Y/n)`);
    try {
      const resp = await chat.receive();
      if (resp.type === 'Text' && resp.content.trim().toLowerCase() === 'y') {
        try {
          await this.userRepository.delete({ username });
          return `User '${username}' deleted`;
        } catch (error) {
          this.logger.error(`User '${username}' delete failed`, error.stack, UserManagerCommand.name);
          return `User '${username}' delete failed`;
        }
      } else {
        return `User '${username}' delete canceled`;
      }
    } catch {
      return `User '${username}' delete canceled`;
    }
  }
}
