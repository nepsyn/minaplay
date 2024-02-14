import { Expose } from 'class-transformer';
import { Equals, IsUrl } from 'class-validator';

/** Network Image */
export class NetworkImage {
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
