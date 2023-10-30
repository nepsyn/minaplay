import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { PermissionEnum } from '../../enums/permission.enum';

export class PermissionDto {
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
