import { Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from '../user/user.entity.js';
import { Exclude } from 'class-transformer';
import { PermissionEnum } from '../../enums/index.js';

@Entity()
export class Permission {
  /** 名称 */
  @PrimaryColumn()
  name: PermissionEnum;

  /** 用户 */
  @Exclude()
  @ManyToOne(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;

  @PrimaryColumn()
  userId: number;
}
