import { Expose } from 'class-transformer';
import { Equals, IsHexColor, IsOptional, IsString } from 'class-validator';

/** Plain Text */
export class Text {
  static Colors = {
    INFO: '#0288d1',
    WARNING: '#ed6c02',
    SUCCESS: '#2e7d32',
    ERROR: '#d32f2f',
  };

  @Expose()
  @Equals('Text')
  type: 'Text' = 'Text';

  /** Color */
  @Expose()
  @IsHexColor()
  @IsOptional()
  color?: string;

  /** Content */
  @Expose()
  @IsString()
  content: string;

  constructor(content: string, color?: string) {
    this.content = content;
    this.color = color;
  }
}
