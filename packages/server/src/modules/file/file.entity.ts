import { Exclude } from 'class-transformer';
import fs from 'fs-extra';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity.js';
import { FileSourceEnum } from '../../enums/index.js';

/** 文件实体 */
@Entity()
export class File {
  /** 文件id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 本地文件名 */
  @Exclude()
  @Column({
    nullable: true,
  })
  filename: string;

  /** 文件名 */
  @Column()
  name: string;

  /** 文件大小(字节) */
  @Column({
    nullable: true,
  })
  size: number;

  /** 文件 md5 */
  @Column({
    nullable: true,
  })
  md5?: string;

  /** 文件 mimetype */
  @Column({
    nullable: true,
  })
  mimetype?: string;

  /** 文件来源 */
  @Column()
  source: FileSourceEnum;

  /** 文件路径 */
  @Exclude()
  @Column({
    length: 1024,
  })
  path: string;

  /** 过期时间 */
  @Exclude()
  @Column({
    nullable: true,
  })
  expireAt?: Date;

  /** 上传用户 */
  @Exclude()
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: Relation<User>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 本地文件是否存在 */
  @Exclude()
  get isExist() {
    return this.source === FileSourceEnum.NETWORK || fs.pathExistsSync(this.path);
  }
}
