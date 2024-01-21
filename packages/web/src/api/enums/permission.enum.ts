export enum PermissionEnum {
  /** 最高权限 */
  ROOT_OP = '*:*',

  /** 文件管理 */
  FILE_OP = 'FILE:*',
  /** 上传图片 */
  FILE_UPLOAD_IMAGE = 'FILE:UPLOAD:IMAGE',
  /** 上传视频 */
  FILE_UPLOAD_VIDEO = 'FILE:UPLOAD:VIDEO',

  /** 媒体管理 */
  MEDIA_OP = 'MEDIA:*',
  /** 媒体查看 */
  MEDIA_VIEW = 'MEDIA:VIEW',

  /** 订阅管理 */
  SUBSCRIBE_OP = 'SUBSCRIBE:*',
  /** 订阅查看 */
  SUBSCRIBE_VIEW = 'SUBSCRIBE:VIEW',

  /** 直播管理 */
  LIVE_OP = 'LIVE:*',
  /** 直播查看 */
  LIVE_VIEW = 'LIVE:VIEW',
}
