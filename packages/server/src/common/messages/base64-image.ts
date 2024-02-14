import { Expose } from 'class-transformer';
import { Equals, IsBase64 } from 'class-validator';

/** base64 Image */
export class Base64Image {
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
