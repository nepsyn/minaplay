import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Series } from './series.entity';
import { Media } from '../media/media.entity';

/** 单集 */
@Entity()
export class Episode {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 本集集数 */
  @Column({
    nullable: true,
  })
  no?: string;

  /** 媒体 */
  @OneToOne(() => Media, {
    onDelete: 'CASCADE',
    eager: true,
  })
  media: Media;

  /** 剧集 */
  @ManyToOne(() => Series, (series) => series.episodes, {
    onDelete: 'CASCADE',
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
