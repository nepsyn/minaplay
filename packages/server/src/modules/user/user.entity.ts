import {
  Column,
  CreateDateColumn,
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
import { File } from '../file/file.entity';
import { Series } from '../series/series.entity';
import { Source } from '../subscribe/source.entity';
import { PermissionEnum } from '../../enums/permission.enum';

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

  /** 邮箱 */
  @Index({
    unique: true,
  })
  @Column({
    nullable: true,
  })
  email: string;

  /** 允许通知 */
  @Column({
    default: false,
  })
  notify: boolean;

  /** 密码 */
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

  /** 权限名称列表 */
  @Expose()
  get permissionNames() {
    return this.permissions?.map((permission) => permission.name) ?? [];
  }

  /** 是否为ROOT用户 */
  @Exclude()
  get isRoot() {
    return this.permissionNames.includes(PermissionEnum.ROOT_OP);
  }

  hasOneOf(...permissions: PermissionEnum[]) {
    return permissions.some((v) => this.permissionNames.includes(v));
  }
}
