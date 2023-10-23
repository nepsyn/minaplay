import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
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
import { RequestIp } from '../../utils/request.ip.decorator';
import { EmailBindDto } from './email-bind.dto';
import { EmailVerifyDto } from './email-verify.dto';

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

  @Post(':userId/logout')
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

  @Post(':userId/grant')
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
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.GRANT,
      ip,
      operator: { id: operator.id },
      target: { id: userId },
      extra: JSON.stringify(data.permissionNames),
    });

    await this.authService.grantPermissions(user, data.permissionNames);

    return await this.userService.findOneBy({ id: userId });
  }

  @Get('permission')
  @ApiOperation({
    description: '获取所有权限',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async fetchAllPermissions() {
    return await this.authService.findAllPermissions();
  }
}
