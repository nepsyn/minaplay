import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '../file/file.entity';
import { Exclude } from 'class-transformer';
import { Series } from './series.entity';

/** 单集 */
@Entity()
export class Episode {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 标题 */
  @Column()
  title: string;

  /** 本集集数 */
  @Column({
    nullable: true,
  })
  no?: string;

  /** 文件 */
  @Exclude()
  @ManyToOne(() => File, {
    eager: true,
  })
  file: File;

  /** 剧集 */
  @Exclude()
  @ManyToOne(() => Series, (series) => series.episodes, {
    eager: true,
  })
  series: Series;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 删除时间 */
  @Exclude()
  @DeleteDateColumn()
  deleteAt: Date;
}
