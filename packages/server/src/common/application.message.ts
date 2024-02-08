import { ClassConstructor, Expose, plainToInstance, Type } from 'class-transformer';
import {
  Equals,
  IsBase64,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
  validateSync,
} from 'class-validator';

interface TypedMessage {
  type: MinaPlayMessageType;
}

/** Plain Text */
export class Text implements TypedMessage {
  @Expose()
  @Equals('Text')
  type: 'Text' = 'Text';

  /** Color */
  @Expose()
  @IsHexColor()
  @IsOptional()
  color?: string;

  /** Content */
  @Expose()
  @IsString()
  @Length(1, 40)
  content: string;

  constructor(content: string, color?: string) {
    this.content = content;
    this.color = color;
  }
}

/** Network Image */
export class NetworkImage implements TypedMessage {
  @Expose()
  @Equals('NetworkImage')
  type: 'NetworkImage' = 'NetworkImage';

  /** URL */
  @Expose()
  @IsUrl()
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

/** base64 Image */
export class Base64Image implements TypedMessage {
  @Expose()
  @Equals('Base64Image')
  type: 'Base64Image' = 'Base64Image';

  /** base64 content */
  @Expose()
  @IsBase64()
  base64: string;

  constructor(base64: string) {
    this.base64 = base64;
  }
}

/** Group Option */
export class Option implements TypedMessage {
  @Expose()
  @Equals('Option')
  type: 'Option' = 'Option';

  /** ID */
  @Expose()
  @IsString()
  id: string;

  /** Option Text */
  @Expose()
  @ValidateNested()
  text: Text;

  constructor(id: string, text: Text) {
    this.id = id;
    this.text = text;
  }
}

/** Action Group */
export class ActionGroup implements TypedMessage {
  @Expose()
  @Equals('ActionGroup')
  type: 'ActionGroup' = 'ActionGroup';

  /** ID */
  @Expose()
  @IsString()
  id: string;

  /** Options */
  @Expose()
  @Type(() => Option)
  @ValidateNested()
  options: Option[];

  constructor(id: string, options: Option[]) {
    this.id = id;
    this.options = options;
  }
}

/** Feedback */
export class Feedback implements TypedMessage {
  @Expose()
  @Equals('Feedback')
  type: 'Feedback' = 'Feedback';

  /** Group ID */
  @Expose()
  @IsString()
  groupId: string;

  /** Option ID */
  @Expose()
  @IsString()
  optionId: string;

  constructor(groupId: string, optionId: string) {
    this.groupId = groupId;
    this.optionId = optionId;
  }
}

const MessageMap = { Text, NetworkImage, Base64Image, Option, ActionGroup, Feedback };
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
