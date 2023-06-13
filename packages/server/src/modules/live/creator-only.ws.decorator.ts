import { SetMetadata } from '@nestjs/common';

export const CREATOR_ONLY_SYMBOL = Symbol('creator-only');

export const CreatorOnly = () => SetMetadata(CREATOR_ONLY_SYMBOL, true);
