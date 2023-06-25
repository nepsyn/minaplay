import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscribeSourceService } from './subscribe-source.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { SubscribeSourceDto } from './subscribe-source.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { SubscribeSourceQueryDto } from './subscribe-source-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { SubscribeSource } from './subscribe-source.entity';

@Controller('subscribe')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SubscribeSourceController {
  constructor(private subscribeSourceService: SubscribeSourceService) {}

  @Post()
  @ApiOperation({
    description: '添加新订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSubscribeSource(@RequestUser() user: User, @Body() data: SubscribeSourceDto) {
    const feed = await this.subscribeSourceService.readSource(data.url);
    if (!feed.title) {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT);
    }

    const source = await this.subscribeSourceService.save({
      ...data,
      user: { id: user.id },
    });
    if (source.enabled) {
      await this.subscribeSourceService.addFetchSubscribeDataJob(source);
    }

    return source;
  }

  @Get(':id')
  @ApiOperation({
    description: '获取订阅源信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getSubscribeSourceById(@Param('id') id: number) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return source;
  }

  @Get()
  @ApiOperation({
    description: '查询订阅源',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async querySubscribeSource(@Query() query: SubscribeSourceQueryDto) {
    const { keyword, id, url, userId } = query;
    const [result, total] = await this.subscribeSourceService.findAndCount({
      where: buildQueryOptions<SubscribeSource>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url, entity.remark],
        exact: { id, url, user: { id: userId } },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改订阅源信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async updateSubscribeSource(@Param('id') id: number, @Body() data: SubscribeSourceDto) {
    let source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (data.url) {
      const feed = await this.subscribeSourceService.readSource(data.url);
      if (!feed.title) {
        throw buildException(BadRequestException, ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT);
      }
    }

    await this.subscribeSourceService.deleteFetchSubscribeDataJob(id);
    source = await this.subscribeSourceService.save({
      id,
      ...data,
    });
    if (source.enabled) {
      await this.subscribeSourceService.addFetchSubscribeDataJob(source);
    }

    return source;
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅源',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSubscribeSource(@Param('id') id: number) {
    await this.subscribeSourceService.deleteFetchSubscribeDataJob(id);
    await this.subscribeSourceService.delete({ id });
    return {};
  }

  @Get(':id/raw')
  @ApiOperation({
    description: '获取订阅源原始数据',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async fetchSourceRawData(@Param('id') id: number) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return this.subscribeSourceService.readSource(source.url);
  }
}
