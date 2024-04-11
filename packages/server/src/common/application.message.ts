import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  Action,
  Base64Image,
  ConsumableGroup,
  Consumed,
  MarkdownText,
  NetworkImage,
  Pending,
  ResourceMedia,
  ResourceSeries,
  Text,
  Timeout,
} from './messages/index.js';

export const MinaPlayMessageMap = {
  Text,
  MarkdownText,
  NetworkImage,
  Base64Image,
  Action,
  Timeout,
  ConsumableGroup,
  Consumed,
  Pending,
  ResourceSeries,
  ResourceMedia,
};
export type MinaPlayMessage =
  | Text
  | MarkdownText
  | NetworkImage
  | Base64Image
  | Action
  | Timeout
  | ConsumableGroup
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
