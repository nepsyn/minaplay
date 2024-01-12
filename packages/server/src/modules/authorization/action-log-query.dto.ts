import { ApiQueryDto } from '../../common/api.query.dto.js';
import { ActionLog } from './action-log.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthActionEnum } from '../../enums/auth-action.enum.js';

export class ActionLogQueryDto extends ApiQueryDto<ActionLog> {
  @ApiProperty({
    description: '操作用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  operatorId?: number;

  @ApiProperty({
    description: '操作用户IP',
    required: false,
  })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({
    description: '操作类型',
    required: false,
  })
  @IsOptional()
  @IsEnum(AuthActionEnum)
  action?: AuthActionEnum;

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end?: string;
}
