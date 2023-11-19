import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Series } from './series.entity';
import { Media } from '../media/media.entity';

/** 单集 */
@Entity()
export class Episode {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 本集标题 */
  @Column({
    nullable: true,
  })
  title?: string;

  /** 本集集数 */
  @Column({
    nullable: true,
  })
  no?: string;

  /** 媒体 */
  @ManyToOne(() => Media, {
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

  /** 发布时间 */
  @Column({
    type: 'datetime',
    nullable: true,
  })
  pubAt: Date;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
