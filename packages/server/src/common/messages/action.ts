import { Expose } from 'class-transformer';
import { Equals, IsString, ValidateNested } from 'class-validator';
import { Text } from './text.js';

export class Action {
  @Expose()
  @Equals('Action')
  type: 'Action' = 'Action';

  /** value */
  @Expose()
  @IsString()
  value: string;

  /** Action Text */
  @Expose()
  @ValidateNested()
  text: Text;

  constructor(value: string, text: Text) {
    this.value = value;
    this.text = text;
  }
}
