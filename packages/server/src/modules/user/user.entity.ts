import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from '../authorization/permission.entity.js';
import { Exclude, Expose } from 'class-transformer';
import { File } from '../file/file.entity.js';
import { Series } from '../media/series/series.entity.js';
import { Source } from '../subscribe/source/source.entity.js';
import { PermissionEnum } from '../../enums/index.js';
import { NotificationMeta } from '../notification/notification-meta.entity.js';

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

  /** 允许通知 */
  @Expose({ groups: ['profile'] })
  @Column({
    default: true,
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
  @OneToMany(() => Permission, (permission) => permission.user, {
    eager: true,
  })
  permissions: Relation<Permission[]>;

  /** 创建的剧集 */
  @Exclude()
  @OneToMany(() => Series, (series) => series.user)
  series: Relation<Series[]>;

  /** 创建的订阅源 */
  @Exclude()
  @OneToMany(() => Source, (source) => source.user)
  sources: Relation<Source[]>;

  /** 创建的通知服务 */
  @Expose({ groups: ['profile'] })
  @OneToMany(() => NotificationMeta, (meta) => meta.user, {
    eager: true,
  })
  metas: Relation<NotificationMeta[]>;

  /** 头像文件 */
  @ManyToOne(() => File, {
    eager: true,
    nullable: true,
  })
  avatar?: Relation<File>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 权限名称列表 */
  @Expose({ groups: ['profile'] })
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
