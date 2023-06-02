import path from 'path';

export const USER_UPLOAD_IMAGE_DIR = path.join(process.cwd(), 'resources/upload/image');
export const USER_UPLOAD_VIDEO_DIR = path.join(process.cwd(), 'resources/upload/video');
export const ARIA2_DOWNLOAD_DIR = path.join(process.cwd(), 'resources/download');
export const SUBSCRIBE_RULE_SOURCE_DIR = path.join(process.cwd(), 'resources/rule');

export const VALID_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/gif'];
export const VALID_VIDEO_MIME = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-flv',
  'video/x-ms-wmv',
  'video/ogg',
  'video/h264',
  'video/h265',
  'video/x-matroska',
  'video/webm',
  'video/x-flv',
];
