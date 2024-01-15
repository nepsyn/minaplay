import { SetMetadata } from '@nestjs/common';

export const ROOM_OWNER_ONLY_KEY = 'ROOM_OWNER_ONLY';

export const RoomOwnerOnly = () => SetMetadata(ROOM_OWNER_ONLY_KEY, true);
