import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Media } from '../media.entity.js';
import { User } from '../../user/user.entity.js';
import { Episode } from '../episode/episode.entity.js';

@Entity()
export class ViewHistory {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 媒体 */
  @ManyToOne(() => Media, {
    onDelete: 'CASCADE',
    eager: true,
  })
  media: Relation<Media>;

  /** 单集 */
  @ManyToOne(() => Episode, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  episode?: Relation<Episode>;

  /** 单集 ID */
  @Column({
    nullable: true,
  })
  episodeId?: number;

  /** 用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;

  /** 进度 */
  @Column({
    nullable: true,
  })
  progress?: number;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
