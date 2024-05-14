import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

export const DATA_DIR = path.join(process.cwd(), 'data');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MINAPLAY_VERSION = fs.readJSONSync(path.join(__dirname, '../package.json')).version;

export const USER_UPLOAD_IMAGE_DIR = path.join(DATA_DIR, 'upload/image');
export const USER_UPLOAD_VIDEO_DIR = path.join(DATA_DIR, 'upload/video');
export const DOWNLOAD_DIR = path.join(DATA_DIR, 'download');
export const INDEX_DIR = path.join(DATA_DIR, 'index');
export const RULE_CODE_DIR = path.join(DATA_DIR, 'rule');
export const GENERATED_DIR = path.join(DATA_DIR, 'generated');
export const LIVE_STREAM_DIR = path.join(DATA_DIR, 'live');
export const PLUGIN_DIR = path.join(DATA_DIR, 'plugin');
export const TEMPLATE_DIR = path.join(DATA_DIR, 'template');

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
