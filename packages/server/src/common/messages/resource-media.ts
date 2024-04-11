import { Expose } from 'class-transformer';
import { Equals } from 'class-validator';
import { Media } from '../../modules/media/media.entity.js';

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
