import { CreateDateColumn, Entity, ManyToMany, PrimaryColumn, Relation, UpdateDateColumn } from 'typeorm';
import { Series } from './series.entity.js';

/** 剧集标签 */
@Entity()
export class SeriesTag {
  /** 剧集标签名称 */
  @PrimaryColumn()
  name: string;

  /** 剧集 */
  @ManyToMany(() => Series, (series) => series.tags, {
    onDelete: 'CASCADE',
  })
  series: Relation<Promise<Series[]>>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
