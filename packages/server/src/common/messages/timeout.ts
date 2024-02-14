import { Expose } from 'class-transformer';
import { Equals, IsNumber } from 'class-validator';

/** Timeout */
export class Timeout {
  @Expose()
  @Equals('Timeout')
  type: 'Timeout' = 'Timeout';

  /** timeout */
  @Expose()
  @IsNumber()
  ms: number;

  constructor(ms: number) {
    this.ms = ms;
  }
}
