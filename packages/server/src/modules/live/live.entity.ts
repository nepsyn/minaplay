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
import { User } from '../user/user.entity';

/** 直播房间 */
@Entity()
export class Live {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 标题 */
  @Column({
    nullable: true,
  })
  title?: string;

  /** 密码 */
  @Exclude()
  @Column({
    nullable: true,
  })
  password?: string;

  /** 封面图片 */
  @Exclude()
  @ManyToOne(() => File, {
    eager: true,
    nullable: true,
  })
  poster?: File;

  /** 创建用户 */
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  user?: User;

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
