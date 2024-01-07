import path from 'path';

export const RESOURCE_DIR = path.join(process.cwd(), 'data');

export const MINAPLAY_VERSION = require('../package.json').version;

export const USER_UPLOAD_IMAGE_DIR = path.join(RESOURCE_DIR, 'upload/image');
export const USER_UPLOAD_VIDEO_DIR = path.join(RESOURCE_DIR, 'upload/video');
export const ARIA2_DOWNLOAD_DIR = path.join(RESOURCE_DIR, 'download');
export const SUBSCRIBE_RULE_SOURCE_DIR = path.join(RESOURCE_DIR, 'rule');
export const GENERATED_DIR = path.join(RESOURCE_DIR, 'generated');
export const LIVE_STREAM_DIR = path.join(RESOURCE_DIR, 'live');

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
];
