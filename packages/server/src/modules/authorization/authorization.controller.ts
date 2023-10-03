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
