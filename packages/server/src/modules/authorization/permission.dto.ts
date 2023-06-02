import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PermissionEnum } from '../../enums/permission.enum';

export class PermissionDto {
  @ApiProperty({
    description: '权限列表',
  })
  @IsArray()
  permissionNames: PermissionEnum[];
}
