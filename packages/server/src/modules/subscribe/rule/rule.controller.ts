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
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RuleService } from './rule.service.js';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum } from '../../../enums/index.js';
import { RequestUser } from '../../../common/request.user.decorator.js';
import { User } from '../../user/user.entity.js';
import { RuleDto } from './rule.dto.js';
import { buildException } from '../../../utils/build-exception.util.js';
import { RULE_CODE_DIR } from '../../../constants.js';
import fs from 'fs-extra';
import { generateMD5 } from '../../../utils/generate-md5.util.js';
import { FileService } from '../../file/file.service.js';
import { RuleQueryDto } from './rule-query.dto.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { Rule } from './rule.entity.js';
import { RuleErrorLog } from './rule-error-log.entity.js';
import { RuleErrorLogService } from './rule-error-log.service.js';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';
import { ApiQueryDto } from '../../../common/api.query.dto.js';
import { isDefined } from 'class-validator';

@Controller('subscribe/rule')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class RuleController {
  constructor(
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private fileService: FileService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSubscribeRule(@RequestUser() user: User, @Body() data: RuleDto) {
    if (!isDefined(data.code)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const file = await this.ruleService.createCodeFile(data.code, user);
    const { id } = await this.ruleService.save({
      ...data,
      sources: data.sourceIds?.map((id) => ({ id })),
      file,
    });
    return await this.ruleService.findOneBy({ id });
  }

  @Get(':id')
  @ApiOperation({
    description: '获取规则信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP, PermissionEnum.SUBSCRIBE_VIEW)
  async getSubscribeRuleById(@Param('id') id: number) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return rule;
  }

  @Get()
  @ApiOperation({
    description: '查询订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async querySubscribeRule(@Query() query: RuleQueryDto) {
    const { keyword, sourceId } = query;

    const [result, total] = await this.ruleService.findAndCount({
      where: buildQueryOptions<Rule>({
        keyword,
        keywordProperties: (entity) => [entity.remark],
        exact: {
          sources: { id: sourceId },
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: query.sortBy,
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async updateSubscribeRule(@Param('id') id: number, @Body() data: RuleDto) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (data.code) {
      await fs.ensureDir(RULE_CODE_DIR);
      await fs.writeFile(rule.file.path, data.code);
      const fileStat = await fs.stat(rule.file.path);
      await this.fileService.save({
        id: rule.file.id,
        size: fileStat.size,
        md5: await generateMD5(data.code),
      });
    }

    await this.ruleService.save({
      id,
      ...data,
      sources: data.sourceIds?.map((id) => ({ id })),
      updateAt: new Date(),
    });

    return await this.ruleService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSubscribeRule(@Param('id') id: number) {
    await this.ruleService.delete({ id });
    return {};
  }

  @Get(':id/log')
  @ApiOperation({
    description: '查询订阅规则错误日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getErrorLogsByRuleId(@Param('id') id: number, @Query() query: ApiQueryDto<RuleErrorLog>) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const [result, total] = await this.ruleErrorLogService.findAndCount({
      where: buildQueryOptions<RuleErrorLog>({
        exact: { rule: { id } },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: query.sortBy,
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete(':id/log')
  @ApiOperation({
    description: '删除所有订阅规则错误日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteErrorLogsByRuleId(@Param('id') id: number) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.ruleErrorLogService.delete({
      rule: { id },
    });
    return {};
  }
}
