import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { UserDto } from './user.dto.js';
import { UserQueryDto } from './user-query.dto.js';
import { buildQueryOptions } from '../../utils/build-query-options.util.js';
import { User } from './user.entity.js';
import { RequestUser } from '../authorization/request.user.decorator.js';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';

@Controller('user')
@UseGuards(AuthorizationGuard)
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id/profile')
  @ApiOperation({
    description: '查看用户信息',
  })
  @SerializeOptions({ groups: ['profile'] })
  async getUserProfileById(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const valid = user.isRoot || user.id === id;
    if (!valid) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    const targetUser = await this.userService.findOneBy({ id });
    if (!targetUser) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return targetUser;
  }

  @Put(':id/profile')
  @ApiOperation({
    description: '修改用户信息',
  })
  @SerializeOptions({ groups: ['profile'] })
  async updateUserProfile(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() data: UserDto) {
    const valid = user.isRoot || user.id === id;
    if (!valid) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    const targetUser = await this.userService.findOneBy({ id });
    if (!targetUser) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.userService.save({
      id,
      ...data,
      avatar: { id: data.avatarFileId },
    });

    return await this.userService.findOneBy({ id });
  }

  @Get()
  @ApiOperation({
    description: '查询用户',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP)
  @SerializeOptions({ groups: ['profile'] })
  async queryUser(@Query() query: UserQueryDto) {
    const { keyword, id, username } = query;
    const [result, total] = await this.userService.findAndCount({
      where: buildQueryOptions<User>({
        keyword,
        keywordProperties: (entity) => [entity.username],
        exact: {
          id,
          username,
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }
}
