import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { FindOptionsOrder } from 'typeorm';

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
  @Transform(({ value }) => {
    const size = Number(value);
    return size < 0 ? 9999 : size;
  })
  size = 40;

  @ApiProperty({
    description: '排序字段',
    type: [String],
    required: false,
    default: ['createAt:ASC'],
  })
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  sort: `${keyof T & string}:${'ASC' | 'DESC'}`[] = ['createAt:ASC'];

  get sortBy(): FindOptionsOrder<T> {
    return Object.fromEntries(this.sort.map((sort) => sort.split(':')));
  }
}
