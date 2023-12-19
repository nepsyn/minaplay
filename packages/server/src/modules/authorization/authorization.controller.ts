import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from './authorization.service';
import { LoginDto } from './login.dto';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthorizationGuard } from './authorization.guard';
import { RequestUser } from './request.user.decorator';
import { User } from '../user/user.entity';
import { RequirePermissions } from './require-permissions.decorator';
import { PermissionDto } from './permission.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { PermissionEnum } from '../../enums/permission.enum';
import { ActionLogService } from './action-log.service';
import { AuthActionEnum } from '../../enums/auth-action.enum';
import { EmailBindDto } from './email-bind.dto';
import { EmailVerifyDto } from './email-verify.dto';
import { ChangePasswordDto } from './change-password.dto';
import { encryptPassword } from '../../utils/encrypt-password.util';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { CreateUserDto } from './create-user.dto';
import { RequestIp } from '../../common/request.ip.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthorizationController {
  constructor(
    private userService: UserService,
    private authService: AuthorizationService,
    private actionLogService: ActionLogService,
  ) {}

  @Post('login')
  @ApiOperation({
    description: '用户登录',
  })
  @HttpCode(200)
  async login(@Body() data: LoginDto, @RequestIp() ip: string) {
    const { username, password } = data;
    const user = await this.userService.findOneBy({ username });
    if (!user) {
      throw buildException(UnauthorizedException, ErrorCodeEnum.WRONG_USERNAME_OR_PASSWORD);
    }

    // 验证用户和密码
    const valid = await compare(password, user.password);
    if (!valid) {
      throw buildException(UnauthorizedException, ErrorCodeEnum.WRONG_USERNAME_OR_PASSWORD);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.LOGIN,
      ip,
      operator: { id: user.id },
      target: { id: user.id },
    });

    return await this.authService.login(user);
  }

  @Post('email/bind')
  @ApiOperation({
    description: '绑定邮箱发送验证邮件',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @HttpCode(200)
  async sendBindingEmail(@Body() data: EmailBindDto, @RequestUser() user: User) {
    const sameEmailUser = await this.userService.findOneBy({ email: data.email });
    if (sameEmailUser) {
      throw buildException(BadRequestException, ErrorCodeEnum.EMAIL_ALREADY_OCCUPIED);
    }

    const key = await this.authService.sendVerifyEmail(data.email, user);
    return {
      email: data.email,
      key,
    };
  }

  @Post('email/verify')
  @ApiOperation({
    description: '验证邮箱地址',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @HttpCode(200)
  async verifyBindingEmail(@Body() data: EmailVerifyDto, @RequestUser() user: User, @RequestIp() ip: string) {
    const cache = await this.authService.verifyEmail(data.key, (cache) => {
      return cache.userId === user.id && cache.code === data.code;
    });
    if (!cache) {
      throw buildException(BadRequestException, ErrorCodeEnum.WRONG_EMAIL_VERIFY_CODE);
    }

    const log = {
      old: user.email,
      current: cache.email,
    };

    await this.userService.save({
      id: user.id,
      email: cache.email,
    });

    await this.actionLogService.save({
      action: AuthActionEnum.BIND_EMAIL,
      ip,
      operator: { id: user.id },
      target: { id: user.id },
      extra: JSON.stringify(log),
    });

    return log;
  }

  @Post('refresh')
  @ApiOperation({
    description: '刷新令牌',
  })
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  async refreshToken(@RequestUser() user: User, @RequestIp() ip: string) {
    await this.actionLogService.save({
      action: AuthActionEnum.REFRESH,
      ip,
      operator: { id: user.id },
      target: { id: user.id },
    });

    return await this.authService.login(user);
  }

  @Post('logout')
  @ApiOperation({
    description: '用户登出',
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  async logout(@RequestUser() user: User, @RequestIp() ip: string) {
    await this.actionLogService.save({
      action: AuthActionEnum.LOGOUT,
      ip,
      operator: { id: user.id },
      target: { id: user.id },
    });

    await this.authService.revokeTicket(user.id);
    return {};
  }

  @Put('password')
  @ApiOperation({
    description: '更改密码',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  async changePassword(@RequestUser() user: User, @RequestIp() ip: string, @Body() data: ChangePasswordDto) {
    const valid = data.old && (await compare(data.old, user.password));
    if (!valid) {
      throw buildException(BadRequestException, ErrorCodeEnum.WRONG_USERNAME_OR_PASSWORD);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.CHANGE_PASSWORD,
      ip,
      operator: { id: user.id },
      target: { id: user.id },
      extra: JSON.stringify(data),
    });

    await this.userService.save({
      id: user.id,
      password: await encryptPassword(data.current),
    });

    return data;
  }

  @Post('user/create')
  @ApiOperation({
    description: '创建用户',
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async createUser(@Body() data: CreateUserDto) {
    const sameNameUser = await this.userService.findOneBy({ username: data.username });
    if (sameNameUser) {
      throw buildException(BadRequestException, ErrorCodeEnum.USERNAME_ALREADY_OCCUPIED);
    }

    if (data.permissionNames.includes(PermissionEnum.ROOT_OP)) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    const { id } = await this.userService.save({
      username: data.username,
      password: await encryptPassword(data.password),
    });
    await this.authService.grantPermissions(id, data.permissionNames);

    return await this.userService.findOneBy({ id });
  }

  @Post('user/:userId/logout')
  @ApiOperation({
    description: '注销指定用户',
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async logoutUser(@RequestUser() operator: User, @Param('userId') userId: number, @RequestIp() ip: string) {
    await this.actionLogService.save({
      action: AuthActionEnum.LOGOUT,
      ip,
      operator: { id: operator.id },
      target: { id: userId },
    });

    await this.authService.revokeTicket(userId);

    return {};
  }

  @Put('user/:userId/password')
  @ApiOperation({
    description: '更改指定用户密码',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async changeUserPassword(
    @RequestUser() operator: User,
    @Param('userId') userId: number,
    @RequestIp() ip: string,
    @Body() data: ChangePasswordDto,
  ) {
    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.CHANGE_PASSWORD,
      ip,
      operator: { id: operator.id },
      target: { id: user.id },
      extra: JSON.stringify({ current: data.current }),
    });

    await this.userService.save({
      id: user.id,
      password: await encryptPassword(data.current),
    });

    return { current: data.current };
  }

  @Put('user/:userId/permission')
  @ApiOperation({
    description: '设置用户权限',
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async grantPermissions(
    @RequestUser() operator: User,
    @Param('userId') userId: number,
    @Body() data: PermissionDto,
    @RequestIp() ip: string,
  ) {
    if (operator.id === userId || data.permissionNames.includes(PermissionEnum.ROOT_OP)) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (user.isRoot) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.GRANT,
      ip,
      operator: { id: operator.id },
      target: { id: userId },
      extra: JSON.stringify(data.permissionNames),
    });

    await this.authService.grantPermissions(user.id, data.permissionNames);

    return await this.userService.findOneBy({ id: userId });
  }

  @Delete('user/:userId')
  @ApiOperation({
    description: '删除用户',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async deleteUser(@Param('id') id: number) {
    const user = await this.userService.findOneBy({ id });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (user.isRoot) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    await this.userService.delete({ id });

    return {};
  }

  @Get('permission')
  @ApiOperation({
    description: '获取所有权限',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async fetchAllPermissions() {
    return Object.keys(PermissionEnum).map((key) => PermissionEnum[key]);
  }
}
