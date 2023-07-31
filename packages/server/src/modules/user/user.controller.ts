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
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';

@Controller('user')
@UseGuards(AuthorizationGuard)
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @ApiOperation({
    description: '查看用户信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.USER_OP, PermissionEnum.USER_VIEW)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOneBy({ id });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return user;
  }

  @Get()
  @ApiOperation({
    description: '查询用户',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.USER_OP, PermissionEnum.USER_VIEW)
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

  @Put(':id')
  @ApiOperation({
    description: '修改用户信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.USER_OP)
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: UserDto) {
    const user = await this.userService.findOneBy({ id });
    if (!user) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.userService.save({
      id,
      ...data,
      avatar: { id: data.avatarFileId },
    });

    return await this.userService.findOneBy({ id });
  }
}
