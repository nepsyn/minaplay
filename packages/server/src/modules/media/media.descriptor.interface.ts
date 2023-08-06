import { File } from '../file/file.entity';

export interface MediaDescriptor {
  name?: (file: File) => string;
  description?: (file: File) => string;
  isPublic?: (file: File) => boolean;
  no?: (file: File) => string;
}
