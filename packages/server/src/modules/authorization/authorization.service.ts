import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { DeepPartial, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { instanceToPlain } from 'class-transformer';
import { UserService } from '../user/user.service';
import { PermissionEnum } from '../../enums/permission.enum';
import { EmailService } from '../notification/email.service';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { generateMD5 } from '../../utils/generate-md5.util';
import { EmailVerifyCache } from './email-verify-cache.interface';

@Injectable()
export class AuthorizationService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheStore: CacheStore,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async login(user: User) {
    const ticket = Date.now().toString();

    const payload = {
      id: user.id,
      ticket,
    };
    const token = await this.signToken(payload);

    await this.updateTicket(user.id, ticket);

    return {
      ...instanceToPlain(user),
      token,
    };
  }

  async sendVerifyEmail(to: string, user: User) {
    const key = await generateMD5(to);
    const token = `email:${key}`;
    if (await this.cacheStore.get(token)) {
      const cache = await this.cacheStore.get<EmailVerifyCache>(token);
      if (Date.now() - cache.lastSendTimestamp < 60 * 1000) {
        return key;
      }
    }

    const code = Math.round(Math.random() * (999999 - 100000) + 100000).toString();
    await this.emailService.notify('verify-code', { code }, to);
    await this.cacheStore.set<EmailVerifyCache>(
      token,
      {
        userId: user.id,
        email: to,
        code,
        lastSendTimestamp: Date.now(),
        secureTimes: 5,
      },
      { ttl: 30 * 60 * 1000 },
    );

    return key;
  }

  async verifyEmail(key: string, predicate: (cache: EmailVerifyCache) => boolean | Promise<boolean>) {
    const token = `email:${key}`;
    const cache = await this.cacheStore.get<EmailVerifyCache>(token);

    if (!cache) {
      return undefined;
    }

    const valid = await predicate(cache);
    if (!valid) {
      cache.secureTimes--;
      if (cache.secureTimes > 0) {
        await this.cacheStore.set(token, cache);
      } else {
        await this.cacheStore.del(token);
      }

      return undefined;
    }

    return cache;
  }

  async updateTicket(id: number, ticket: string) {
    return await this.userService.save({
      id,
      ticket,
    });
  }

  async revokeTicket(id: number) {
    return await this.userService.save({
      id,
      ticket: null,
    });
  }

  async signToken(data: object) {
    return await this.jwtService.signAsync(data);
  }

  async verifyToken<T extends object>(token: string) {
    return await this.jwtService.verifyAsync<T>(token);
  }

  async tryVerifyToken<T extends object>(token: string) {
    try {
      return await this.jwtService.verifyAsync<T>(token);
    } catch {
      return null;
    }
  }

  async findAllPermissions() {
    return await this.permissionRepository.find();
  }

  async grantPermissions(user: DeepPartial<User>, permissionNames: PermissionEnum[]) {
    return await this.userService.save({
      ...user,
      permissions: permissionNames.map((name) => ({ name })),
    });
  }
}
