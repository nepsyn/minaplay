import { Expose } from 'class-transformer';
import { Equals, IsString } from 'class-validator';

/** Feedback */
export class ConsumableFeedback {
  @Expose()
  @Equals('ConsumableFeedback')
  type: 'ConsumableFeedback' = 'ConsumableFeedback';

  /** Group ID */
  @Expose()
  @IsString()
  id: string;

  /** value */
  @Expose()
  @IsString()
  value: string;

  constructor(id: string, value: string) {
    this.id = id;
    this.value = value;
  }
}
