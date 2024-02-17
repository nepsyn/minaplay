import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Text } from './messages/text.js';
import { NetworkImage } from './messages/network-image.js';
import { Consumed } from './messages/consumed.js';
import { Base64Image } from './messages/base64-image.js';
import { Action } from './messages/action.js';
import { Timeout } from './messages/timeout.js';
import { ConsumableGroup } from './messages/consumable-group.js';
import { ConsumableFeedback } from './messages/consumable-feedback.js';
import { Pending } from './messages/pending.js';

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
  | Pending;
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
