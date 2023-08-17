import { File } from '../file/file.entity';

export interface MediaDescriptor {
  name?: string | ((file: File) => string);
  description?: string | ((file: File) => string);
  isPublic?: boolean | ((file: File) => boolean);

  title?: string | ((file: File) => string);
  no?: string | ((file: File) => string);
}
