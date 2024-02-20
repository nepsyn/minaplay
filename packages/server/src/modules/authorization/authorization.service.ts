import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './permission.entity.js';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity.js';
import { instanceToPlain } from 'class-transformer';
import { UserService } from '../user/user.service.js';
import { PermissionEnum } from '../../enums/index.js';

@Injectable()
export class AuthorizationService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async login(user: User) {
    const ticket = user.ticket ?? Date.now().toString();
    if (!user.ticket) {
      await this.updateTicket(user.id, ticket);
    }

    const payload = {
      id: user.id,
      ticket,
    };
    const token = await this.signToken(payload);

    return {
      ...instanceToPlain(user, { groups: ['profile'] }),
      token,
    };
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

  async grantPermissions(userId: number, permissionNames: PermissionEnum[]) {
    await this.permissionRepository.delete({ userId });
    await this.permissionRepository.save(
      permissionNames.map((name) => ({
        userId,
        name,
      })),
    );
  }
}
