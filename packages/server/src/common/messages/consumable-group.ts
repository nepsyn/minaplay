import { Expose, Type } from 'class-transformer';
import { Equals, IsString, ValidateNested } from 'class-validator';
import { MinaPlayMessage, MinaPlayMessageMap } from '../application.message.js';

/** Consumable Group */
export class ConsumableGroup {
  @Expose()
  @Equals('ConsumableGroup')
  type: 'ConsumableGroup' = 'ConsumableGroup';

  /** ID */
  @Expose()
  @IsString()
  id: string;

  /** Actions */
  @Expose()
  @Type(({ object }) => MinaPlayMessageMap[object?.['type']])
  @ValidateNested()
  items: MinaPlayMessage[];

  constructor(id: string, items: MinaPlayMessage[]) {
    this.id = id;
    this.items = items;
  }
}
