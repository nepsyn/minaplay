import { CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Series } from './series.entity';

/** 剧集标签 */
@Entity()
export class SeriesTag {
  /** 剧集标签名称 */
  @PrimaryColumn()
  name: string;

  /** 剧集 */
  @ManyToMany(() => Series, (series) => series.tags)
  series: Series[];

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 删除时间 */
  @Exclude()
  @DeleteDateColumn()
  deleteAt: Date;
}
