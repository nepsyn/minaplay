import { CanActivate, ExecutionContext, Injectable, NotImplementedException } from '@nestjs/common';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { NotificationService } from './notification.service.js';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ADAPTER_KEY } from './require-adapter.decorator.js';

@Injectable()
export class AdapterEnabledGuard implements CanActivate {
  constructor(private reflector: Reflector, private notificationService: NotificationService) {}

  canActivate(context: ExecutionContext) {
    const adapterType = this.reflector.get(REQUIRE_ADAPTER_KEY, context.getHandler());
    const adapter = this.notificationService.getAdapter(adapterType);

    if (!adapter || !adapter.isEnabled()) {
      throw buildException(NotImplementedException, ErrorCodeEnum.NOT_IMPLEMENTED);
    }

    return true;
  }
}
