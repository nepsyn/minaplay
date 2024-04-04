import { Expose } from 'class-transformer';
import { Equals, IsString } from 'class-validator';

/** Markdown Text */
export class MarkdownText {
  @Expose()
  @Equals('MarkdownText')
  type: 'MarkdownText' = 'MarkdownText';

  /** Content */
  @Expose()
  @IsString()
  content: string;

  constructor(content: string) {
    this.content = content;
  }
}
