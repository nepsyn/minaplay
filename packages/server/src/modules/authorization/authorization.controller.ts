import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from './authorization.service.js';
import { LoginDto } from './login.dto.js';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { AuthorizationGuard } from './authorization.guard.js';
import { RequestUser } from '../../common/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { RequirePermissions } from './require-permissions.decorator.js';
import { PermissionDto } from './permission.dto.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { ActionLogService } from './action-log.service.js';
import { AuthActionEnum } from '../../enums/auth-action.enum.js';
import { ChangePasswordDto } from './change-password.dto.js';
import { encryptPassword } from '../../utils/encrypt-password.util.js';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception.js';
import { CreateUserDto } from './create-user.dto.js';
import { RequestIp } from '../../common/request.ip.decorator.js';
import { isInt } from 'class-validator';
import { ActionLogQueryDto } from './action-log-query.dto.js';
import { buildQueryOptions } from '../../utils/build-query-options.util.js';
import { Between } from 'typeorm';
import { ActionLog } from './action-log.entity.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';

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
  @SerializeOptions({ groups: ['profile'] })
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
  async logoutUser(
    @RequestUser() operator: User,
    @Param('userId', ParseIntPipe) userId: number,
    @RequestIp() ip: string,
  ) {
    if (!isInt(userId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (user.isRoot) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

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
    @Param('userId', ParseIntPipe) userId: number,
    @RequestIp() ip: string,
    @Body() data: ChangePasswordDto,
  ) {
    if (!isInt(userId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (user.isRoot) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    await this.actionLogService.save({
      action: AuthActionEnum.CHANGE_PASSWORD,
      ip,
      operator: { id: operator.id },
      target: { id: user.id },
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
  @SerializeOptions({ groups: ['profile'] })
  async grantPermissions(
    @RequestUser() operator: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: PermissionDto,
    @RequestIp() ip: string,
  ) {
    if (!isInt(userId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

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
  async deleteUser(@Param('userId', ParseIntPipe) userId: number) {
    if (!isInt(userId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const user = await this.userService.findOneBy({ id: userId });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (user.isRoot) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    await this.userService.delete({ id: userId });

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

  @Get('logs')
  @ApiOperation({
    description: '查询操作日志',
  })
  @ApiBearerAuth()
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async queryActionLog(@Query() query: ActionLogQueryDto) {
    const { operatorId, ip, action, start, end } = query;
    const [result, total] = await this.actionLogService.findAndCount({
      where: buildQueryOptions<ActionLog>({
        exact: {
          operator: { id: operatorId },
          ip,
          action,
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }
}
