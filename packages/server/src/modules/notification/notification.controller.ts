import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  NotImplementedException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { RequestUser } from '../../common/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { NotificationMetaService } from './notification-meta.service.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/index.js';
import { NotificationService } from './notification.service.js';
import { NotificationMetaDto } from './notification-meta.dto.js';
import { NotificationDto } from './notification.dto.js';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotificationServiceAdapter } from './notification-service-adapter.interface.js';

@Controller('notification')
@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthorizationGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private notificationMetaService: NotificationMetaService,
  ) {}

  private async validateNotificationData(data: NotificationDto): Promise<[NotificationServiceAdapter, object]> {
    const adapter = this.notificationService.getAdapter(data.service);
    if (!adapter || !adapter?.isEnabled()) {
      throw buildException(NotImplementedException, ErrorCodeEnum.NOT_IMPLEMENTED);
    }

    const config = plainToInstance(adapter.adapterConfigType, data.config);
    const errors = await validate(config, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
    });
    if (errors.length > 0) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    return [adapter, config];
  }

  @Get('adapters')
  @ApiOperation({
    description: '获取系统已启用通知服务',
  })
  async getEnabledAdapters() {
    return { adapters: this.notificationService.enabledAdapters };
  }

  @Get()
  @ApiOperation({
    description: '获取所有通知服务',
  })
  async getAllMetas(@RequestUser() user: User) {
    const [metas, count] = await this.notificationMetaService.findAndCount({
      where: {
        user: { id: user.id },
      },
    });
    return new ApiPaginationResultDto(metas, count, 0, -1);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改通知服务',
  })
  async updateMetaSubscribes(@RequestUser() user: User, @Param('id') id: number, @Body() data: NotificationMetaDto) {
    const meta = await this.notificationMetaService.findOneBy({
      id,
      user: { id: user.id },
    });
    if (!meta) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const adapter = this.notificationService.getAdapter(meta.service);
    if (!adapter) {
      throw buildException(NotImplementedException, ErrorCodeEnum.NOT_IMPLEMENTED);
    }

    await this.notificationMetaService.save({
      id,
      enabled: data.enabled,
      events: data.subscribes?.join(','),
    });

    return await this.notificationMetaService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除通知服务配置',
  })
  async deleteMetaById(@RequestUser() user: User, @Param('id') id: number) {
    await this.notificationMetaService.delete({
      id,
      user: { id: user.id },
    });
    return {};
  }

  @Post('test')
  @ApiOperation({
    description: '测试通知服务',
  })
  @HttpCode(200)
  async testService(@RequestUser() user: User, @Body() data: NotificationDto) {
    const [adapter, config] = await this.validateNotificationData(data);
    await adapter.test(user, config);
    return {};
  }

  @Post('bind')
  @ApiOperation({
    description: '添加通知服务',
  })
  @HttpCode(200)
  async bindService(@RequestUser() user: User, @Body() data: NotificationDto) {
    const [, config] = await this.validateNotificationData(data);

    const meta = await this.notificationMetaService.findOneBy({
      user: { id: user.id },
      service: data.service,
    });
    if (meta) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATED_NOTIFICATION_SERVICE);
    }

    const { id } = await this.notificationMetaService.save({
      user: { id: user.id },
      service: data.service,
      enabled: true,
      config: JSON.stringify(config),
    });
    return await this.notificationMetaService.findOneBy({ id });
  }
}
