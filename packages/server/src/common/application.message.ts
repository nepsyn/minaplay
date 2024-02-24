import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Text } from './messages/text.js';
import {
  Action,
  Base64Image,
  ConsumableFeedback,
  ConsumableGroup,
  Consumed,
  NetworkImage,
  Pending,
  ResourceMedia,
  ResourceSeries,
  Timeout,
} from './messages/index.js';

export const MinaPlayMessageMap = {
  Text,
  NetworkImage,
  Base64Image,
  Action,
  Timeout,
  ConsumableGroup,
  ConsumableFeedback,
  Consumed,
  Pending,
  ResourceSeries,
  ResourceMedia,
};
export type MinaPlayMessage =
  | Text
  | NetworkImage
  | Base64Image
  | Action
  | Timeout
  | ConsumableGroup
  | ConsumableFeedback
  | Consumed
  | Pending
  | ResourceSeries
  | ResourceMedia;
export type MinaPlayMessageType = MinaPlayMessage['type'];

/** 通过对象构造消息类型 */
export function parseMessage<T extends MinaPlayMessage>(plainObject: T): T | null {
  if (!plainObject || !plainObject.type || !MinaPlayMessageMap[plainObject.type]) {
    return null;
  }

  const message = plainToInstance(MinaPlayMessageMap[plainObject.type] as ClassConstructor<T>, plainObject, {
    excludeExtraneousValues: true,
  });
  const errors = validateSync(message);

  return errors.length === 0 ? message : null;
}
