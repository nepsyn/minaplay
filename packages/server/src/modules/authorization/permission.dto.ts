import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PermissionEnum } from '../../enums/permission.enum';

export class PermissionDto {
  @ApiProperty({
    description: '权限列表',
  })
  @IsEnum(PermissionEnum, {
    each: true,
  })
  permissionNames: PermissionEnum[];
}
