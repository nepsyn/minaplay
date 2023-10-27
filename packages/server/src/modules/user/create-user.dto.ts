import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { PermissionEnum } from '../../enums/permission.enum';

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  username: string;

  @ApiProperty({
    description: '密码',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  password: string;

  @ApiProperty({
    description: '权限列表',
  })
  @IsEnum(PermissionEnum, {
    each: true,
  })
  permissionNames: PermissionEnum[];
}
