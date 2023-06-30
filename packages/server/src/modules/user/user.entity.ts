import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from '../authorization/permission.entity';
import { Exclude, Expose } from 'class-transformer';
import { hash } from 'bcrypt';
import { File } from '../file/file.entity';
import { Series } from '../series/series.entity';
import { Source } from '../subscribe/source.entity';

/** 用户 */
@Entity()
export class User {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 用户名 */
  @Index({
    unique: true,
  })
  @Column({
    nullable: true,
  })
  username: string;

  /** Token */
  @Exclude()
  @Column()
  password: string;

  /** 用户当前登录 Ticket */
  @Exclude()
  @Column({
    nullable: true,
  })
  ticket?: string;

  /** 权限 */
  @Exclude()
  @ManyToMany(() => Permission, (permission) => permission.users, {
    eager: true,
  })
  @JoinTable()
  permissions: Permission[];

  /** 创建的剧集 */
  @Exclude()
  @OneToMany(() => Series, (series) => series.user)
  series: Series[];

  /** 创建的订阅源 */
  @Exclude()
  @OneToMany(() => Source, (source) => source.user)
  sources: Source[];

  /** 头像文件 */
  @Exclude()
  @ManyToOne(() => File, {
    eager: true,
    nullable: true,
  })
  avatar?: File;

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

  /** 权限名称列表 */
  @Exclude()
  get permissionNames() {
    return this.permissions?.map((permission) => permission.name);
  }

  /** 头像文件 id */
  @Expose()
  get avatarFileId() {
    return this.avatar?.id;
  }

  @BeforeInsert()
  async genPassword() {
    this.password = await hash(this.password, 10);
  }
}
