import { SetMetadata } from '@nestjs/common';

export const ROOM_OWNER_ONLY_SYMBOL = Symbol('room-owner-only');

export const RoomOwnerOnly = () => SetMetadata(ROOM_OWNER_ONLY_SYMBOL, true);
