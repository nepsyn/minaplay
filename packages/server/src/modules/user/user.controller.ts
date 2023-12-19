import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { UserDto } from './user.dto';
import { UserQueryDto } from './user-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { User } from './user.entity';
import { RequestUser } from '../authorization/request.user.decorator';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { instanceToPlain } from 'class-transformer';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto';

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
  async getUserProfileById(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const targetUser = await this.userService.findOneBy({ id });
    if (!targetUser) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const valid = user.isRoot || user.id === targetUser.id;
    if (!valid) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    return instanceToPlain(targetUser, { groups: ['profile'] });
  }

  @Put(':id/profile')
  @ApiOperation({
    description: '修改用户信息',
  })
  async updateUserProfile(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() data: UserDto) {
    const targetUser = await this.userService.findOneBy({ id });
    if (!targetUser) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const valid = user.isRoot || user.id === targetUser.id;
    if (!valid) {
      throw buildException(ForbiddenException, ErrorCodeEnum.NO_PERMISSION);
    }

    await this.userService.save({
      id,
      ...data,
      avatar: { id: data.avatarFileId },
    });

    return instanceToPlain(await this.userService.findOneBy({ id }), { groups: ['profile'] });
  }

  @Get()
  @ApiOperation({
    description: '查询用户',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP)
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

    return new ApiPaginationResultDto(
      result.map((v) => instanceToPlain(v, { groups: ['profile'] })),
      total,
      query.page,
      query.size,
    );
  }
}
