import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Series } from './series.entity';

/** 剧集订阅 */
@Entity()
export class SeriesSubscribe {
  /** 用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn()
  userId: number;

  /** 剧集 */
  @ManyToOne(() => Series, {
    eager: true,
    onDelete: 'CASCADE',
  })
  series: Series;

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
