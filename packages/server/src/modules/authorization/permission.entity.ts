import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Exclude } from 'class-transformer';
import { PermissionEnum } from '../../enums/permission.enum';

@Entity()
export class Permission {
  /** 名称 */
  @PrimaryColumn()
  name: PermissionEnum;

  /** 用户 */
  @Exclude()
  @ManyToMany(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  users: User[];

  /** 描述 */
  @Column({
    nullable: true,
  })
  description: string;
}
