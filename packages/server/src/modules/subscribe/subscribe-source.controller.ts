import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { SubscribeRuleService } from './subscribe-rule.service';

@Controller('subscribe')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SubscribeSourceController {
  constructor(
    private subscribeSourceService: SubscribeSourceService,
    private subscribeRuleService: SubscribeRuleService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加新订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSubscribeSource(@RequestUser() user: User, @Body() data: SubscribeSourceDto) {
    if (data.url == null || data.enabled == null) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const { id } = await this.subscribeSourceService.save({
      ...data,
      user: { id: user.id },
    });
    const source = await this.subscribeSourceService.findOneBy({ id });
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
  async getSubscribeSourceById(@Param('id', ParseIntPipe) id: number) {
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
  async updateSubscribeSource(@Param('id', ParseIntPipe) id: number, @Body() data: SubscribeSourceDto) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.subscribeSourceService.save({
      id,
      ...data,
    });

    if (data.enabled !== undefined) {
      await this.subscribeSourceService.deleteFetchSubscribeDataJob(id);
      if (data.enabled === true) {
        await this.subscribeSourceService.addFetchSubscribeDataJob(source);
      }
    }

    return await this.subscribeSourceService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅源',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSubscribeSource(@Param('id', ParseIntPipe) id: number) {
    await this.subscribeSourceService.deleteFetchSubscribeDataJob(id);
    await this.subscribeSourceService.delete({ id });
    return {};
  }

  @Get(':id/raw')
  @ApiOperation({
    description: '获取订阅源原始数据',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async fetchSourceRawData(@Param('id', ParseIntPipe) id: number) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    try {
      return this.subscribeSourceService.readSource(source.url);
    } catch {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT);
    }
  }

  @Post(':id/run')
  @ApiOperation({
    description: '立即执行更新订阅源操作',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async runFetchJob(@Param('id', ParseIntPipe) id: number) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.subscribeSourceService.runFetchSubscribeDataJob(source);
  }

  @Get(':id/rule')
  @ApiOperation({
    description: '获取订阅源规则列表',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getSubscribeRulesBySourceId(@Param('id', ParseIntPipe) id: number) {
    const source = await this.subscribeSourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const [rules] = await this.subscribeRuleService.findAndCount({
      where: {
        source: { id },
      },
    });

    return rules;
  }
}
