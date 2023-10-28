import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Media } from './media.entity';
import { User } from '../user/user.entity';
import { Episode } from '../series/episode.entity';

@Entity()
export class ViewHistory {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 媒体 */
  @ManyToOne(() => Media, {
    eager: true,
    onDelete: 'CASCADE',
  })
  media: Media;

  /** 单集 */
  @ManyToOne(() => Episode, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  episode?: Episode;

  @Column({
    nullable: true,
  })
  episodeId?: number;

  /** 用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

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

  /** 删除时间 */
  @Exclude()
  @DeleteDateColumn()
  deleteAt: Date;
}
