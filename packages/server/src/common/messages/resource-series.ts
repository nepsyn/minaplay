import { Expose } from 'class-transformer';
import { Equals } from 'class-validator';
import { Series } from '../../modules/index.js';

/** Resource Series */
export class ResourceSeries {
  @Expose()
  @Equals('ResourceSeries')
  type: 'ResourceSeries' = 'ResourceSeries';

  /** Content */
  @Expose()
  series: Series;

  constructor(series: Series) {
    this.series = series;
  }
}
