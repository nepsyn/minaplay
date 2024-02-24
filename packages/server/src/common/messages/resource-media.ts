import { Media } from '../../modules/index.js';
import { Expose } from 'class-transformer';
import { Equals } from 'class-validator';

/** Resource Media */
export class ResourceMedia {
  @Expose()
  @Equals('ResourceMedia')
  type: 'ResourceMedia' = 'ResourceMedia';

  /** Content */
  @Expose()
  media: Media;

  constructor(media: Media) {
    this.media = media;
  }
}
