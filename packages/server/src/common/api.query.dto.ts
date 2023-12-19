import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ApiQueryDto<T extends { createAt: Date }> {
  @ApiProperty({
    description: '分页页数',
    type: Number,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  page = 0;

  @ApiProperty({
    description: '分页大小',
    type: Number,
    required: false,
    default: 40,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  size = 40;

  @ApiProperty({
    description: '排序字段',
    type: String,
    required: false,
    default: 'createAt',
  })
  @IsString()
  sort: keyof T = 'createAt';

  @ApiProperty({
    description: '排序方式',
    type: String,
    required: false,
    default: 'ASC',
  })
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';
}
