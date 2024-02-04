import { SetMetadata } from '@nestjs/common';
import { NotificationServiceEnum } from '../../enums/notification-service.enum.js';

export const REQUIRE_ADAPTER_KEY = 'REQUIRE_ADAPTER';

export const RequireAdapter = (adapter: NotificationServiceEnum) => SetMetadata(REQUIRE_ADAPTER_KEY, adapter);
