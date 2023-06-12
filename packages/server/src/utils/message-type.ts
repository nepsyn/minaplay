import { ClassConstructor, Expose, plainToInstance } from 'class-transformer';
import { Equals, IsBase64, IsString, IsUrl, Length, validateSync } from 'class-validator';

interface TypedMessage {
  type: MinaplayMessageType;
}

/** 普通文本 */
export class Text implements TypedMessage {
  @Expose()
  @Equals('Text')
  type: 'Text';

  /** 文本内容 */
  @Expose()
  @IsString()
  @Length(1, 256)
  content: string;
}

/** 网络图片 */
export class NetworkImage implements TypedMessage {
  @Expose()
  @Equals('NetworkImage')
  type: 'NetworkImage';

  /** 图片 url */
  @Expose()
  @IsUrl()
  url: string;
}

/** base64 图片 */
export class Base64Image implements TypedMessage {
  @Expose()
  @Equals('Base64Image')
  type: 'Base64Image';

  /** 图片 base64 编码 */
  @Expose()
  @IsBase64()
  base64: string;
}

const MessageMap = { Text, NetworkImage, Base64Image };
export type MinaplayMessageType = keyof typeof MessageMap;
export type MinaplayMessage = InstanceType<(typeof MessageMap)[MinaplayMessageType]>;

/** 通过对象构造消息类型 */
export function parseMessage<T extends MinaplayMessage>(plainObject: T): T | null {
  if (!plainObject || !plainObject.type || !MessageMap[plainObject.type]) {
    return null;
  }

  const message = plainToInstance(MessageMap[plainObject.type] as ClassConstructor<T>, plainObject, {
    excludeExtraneousValues: true,
  });
  const errors = validateSync(message);

  return errors.length === 0 ? message : null;
}
