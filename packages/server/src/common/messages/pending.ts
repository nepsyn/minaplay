import { Expose } from 'class-transformer';
import { Equals, IsHexColor, IsOptional } from 'class-validator';

/** Pending */
export class Pending {
  @Expose()
  @Equals('Pending')
  type: 'Pending' = 'Pending';

  /** Color */
  @Expose()
  @IsHexColor()
  @IsOptional()
  color?: string;

  constructor(color?: string) {
    this.color = color;
  }
}
