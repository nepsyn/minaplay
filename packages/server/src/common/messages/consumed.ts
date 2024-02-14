import { Expose } from 'class-transformer';
import { Equals, IsString } from 'class-validator';

/** Consumed */
export class Consumed {
  @Expose()
  @Equals('Consumed')
  type: 'Consumed' = 'Consumed';

  /** ID */
  @Expose()
  @IsString()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
