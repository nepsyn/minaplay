import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from '../user/user.entity.js';
import { Series } from './series.entity.js';
import { Exclude } from 'class-transformer';

/** 剧集订阅 */
@Entity()
export class SeriesSubscribe {
  /** 用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;

  @Exclude()
  @PrimaryColumn()
  userId: number;

  /** 剧集 */
  @ManyToOne(() => Series, {
    onDelete: 'CASCADE',
  })
  series: Relation<Series>;

  @Exclude()
  @PrimaryColumn()
  seriesId: number;

  /** 启用通知 */
  @Column({
    nullable: true,
    default: true,
  })
  notify: boolean;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
