import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ADMIN_SYMBOL = Symbol('require-admin');

export const RequireAdmin = () => SetMetadata(REQUIRE_ADMIN_SYMBOL, true);
