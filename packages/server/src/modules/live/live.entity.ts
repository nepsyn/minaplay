import {
  BeforeInsert,
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
import { hash } from 'bcrypt';

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
    eager: true,
  })
  user: User;

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

  @BeforeInsert()
  async genPassword() {
    this.password = await hash(this.password, 10);
  }
}
