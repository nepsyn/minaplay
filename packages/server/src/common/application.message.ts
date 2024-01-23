import { ClassConstructor, Expose, plainToInstance } from 'class-transformer';
import { Equals, IsHexColor, IsOptional, IsString, IsUrl, Length, validateSync } from 'class-validator';

interface TypedMessage {
  type: MinaPlayMessageType;
}

/** 普通文本 */
export class Text implements TypedMessage {
  @Expose()
  @Equals('Text')
  type: 'Text' = 'Text';

  /** 颜色 */
  @Expose()
  @IsHexColor()
  @IsOptional()
  color?: string;

  /** 文本内容 */
  @Expose()
  @IsString()
  @Length(1, 40)
  content: string;

  constructor(content: string, color?: string) {
    this.content = content;
    this.color = color;
  }
}

/** 网络图片 */
export class NetworkImage implements TypedMessage {
  @Expose()
  @Equals('NetworkImage')
  type: 'NetworkImage' = 'NetworkImage';

  /** 图片 url */
  @Expose()
  @IsUrl()
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

const MessageMap = { Text, NetworkImage };
export type MinaPlayMessageType = keyof typeof MessageMap;
export type MinaPlayMessage = InstanceType<(typeof MessageMap)[MinaPlayMessageType]>;

/** 通过对象构造消息类型 */
export function parseMessage<T extends MinaPlayMessage>(plainObject: T): T | null {
  if (!plainObject || !plainObject.type || !MessageMap[plainObject.type]) {
    return null;
  }

  const message = plainToInstance(MessageMap[plainObject.type] as ClassConstructor<T>, plainObject, {
    excludeExtraneousValues: true,
  });
  const errors = validateSync(message);

  return errors.length === 0 ? message : null;
}
