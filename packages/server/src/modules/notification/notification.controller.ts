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
  ParseIntPipe,
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
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { NotificationService } from './notification.service.js';
import { NotificationSubscribeDto } from './notification-subscribe.dto.js';
import { EmailBindDto } from './adapters/email/email-bind.dto.js';
import { EmailVerifyDto } from './adapters/email/email-verify.dto.js';
import { EmailAdapter } from './adapters/email/email.adapter.js';
import { NotificationServiceEnum } from '../../enums/notification-service.enum.js';
import { AdapterEnabledGuard } from './adapter-enabled.guard.js';
import { RequireAdapter } from './require-adapter.decorator.js';
import { NotificationSubscribeService } from './notification-subscribe.service.js';

@Controller('notification')
@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthorizationGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private notificationMetaService: NotificationMetaService,
    private notificationSubscribeService: NotificationSubscribeService,
    private emailAdapter: EmailAdapter,
  ) {}

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

  @Put(':id/subscribe')
  @ApiOperation({
    description: '修改通知服务事件订阅',
  })
  async updateMetaSubscribes(
    @RequestUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: NotificationSubscribeDto,
  ) {
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

    await this.notificationSubscribeService.delete({
      metaId: id,
    });
    for (const name of data.subscribes) {
      await this.notificationSubscribeService.save({
        metaId: id,
        name,
      });
    }
    return await this.notificationMetaService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除通知服务配置',
  })
  async deleteMetaById(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    await this.notificationMetaService.delete({
      id,
      user: { id: user.id },
    });
    return {};
  }

  @Post('ws/bind')
  @ApiOperation({
    description: '添加ws通知',
  })
  @RequireAdapter(NotificationServiceEnum.WS)
  @UseGuards(AdapterEnabledGuard)
  @HttpCode(200)
  async bindWs(@RequestUser() user: User) {
    const meta = await this.notificationMetaService.findOneBy({
      user: { id: user.id },
      service: NotificationServiceEnum.WS,
    });
    if (meta) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATED_NOTIFICATION_SERVICE);
    }

    const { id } = await this.notificationMetaService.save({
      user: { id: user.id },
      service: NotificationServiceEnum.WS,
      enabled: true,
    });
    return await this.notificationMetaService.findOneBy({ id });
  }

  @Post('email/bind')
  @ApiOperation({
    description: '添加邮箱通知发送验证邮件',
  })
  @RequireAdapter(NotificationServiceEnum.EMAIL)
  @UseGuards(AdapterEnabledGuard)
  @HttpCode(200)
  async bindEmail(@Body() data: EmailBindDto, @RequestUser() user: User) {
    const meta = await this.notificationMetaService.findOneBy({
      user: { id: user.id },
      service: NotificationServiceEnum.EMAIL,
    });
    if (meta) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATED_NOTIFICATION_SERVICE);
    }

    const key = await this.emailAdapter.sendVerifyEmail(data.email, user);
    return {
      email: data.email,
      key,
    };
  }

  @Post('email/verify')
  @ApiOperation({
    description: '验证邮箱地址',
  })
  @RequireAdapter(NotificationServiceEnum.EMAIL)
  @UseGuards(AdapterEnabledGuard)
  @HttpCode(200)
  async verifyEmail(@Body() data: EmailVerifyDto, @RequestUser() user: User) {
    const cache = await this.emailAdapter.verifyEmail(data.key, (cache) => {
      return cache.userId === user.id && cache.code === data.code;
    });
    if (!cache) {
      throw buildException(BadRequestException, ErrorCodeEnum.WRONG_EMAIL_VERIFY_CODE);
    }

    const { id } = await this.notificationMetaService.save({
      user: { id: cache.userId },
      service: NotificationServiceEnum.EMAIL,
      enabled: true,
      config: JSON.stringify({ address: cache.email }),
    });
    return await this.notificationMetaService.findOneBy({ id });
  }
}
