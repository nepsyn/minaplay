import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { DeepPartial, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { instanceToPlain } from 'class-transformer';
import { UserService } from '../user/user.service';
import { PermissionEnum } from '../../enums/permission.enum';

@Injectable()
export class AuthorizationService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
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
