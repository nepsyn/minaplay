import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { PermissionEnum } from '../../enums/permission.enum.js';

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
    enum: PermissionEnum,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PermissionEnum, {
    each: true,
  })
  permissionNames: PermissionEnum[];
}
