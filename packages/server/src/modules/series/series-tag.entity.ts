import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Series } from './series.entity';

/** 剧集标签 */
@Entity()
export class SeriesTag {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 剧集标签名称 */
  @Column({
    unique: true,
  })
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
