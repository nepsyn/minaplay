import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '../file/file.entity.js';
import { Exclude, Expose } from 'class-transformer';
import { User } from '../user/user.entity.js';
import { isDefined } from 'class-validator';

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

  /** 是否有密码 */
  @Expose()
  get hasPassword() {
    return isDefined(this.password);
  }

  /** 封面图片 */
  @ManyToOne(() => File, {
    eager: true,
    nullable: true,
  })
  poster?: Relation<File>;

  /** 创建用户 */
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  user?: Relation<User>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
