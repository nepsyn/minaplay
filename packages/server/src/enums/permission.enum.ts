export enum PermissionEnum {
  /** 授权权限 */
  GRANT_PERMISSION = 'GRANT:PERMISSION',

  /** 用户操作 */
  MANAGE_USER = 'MANAGE:USER',

  /** 文件操作 */
  MANAGE_FILE = 'MANAGE:FILE',
  /** 上传图片 */
  UPLOAD_IMAGE = 'UPLOAD:IMAGE',
  /** 上传视频 */
  UPLOAD_VIDEO = 'UPLOAD:VIDEO',

  /** 操作剧集 */
  MANAGE_SERIES = 'MANAGE:SERIES',
  /** 获取剧集 */
  FETCH_SERIES = 'FETCH:SERIES',

  /** 操作订阅 */
  MANAGE_SUBSCRIBE = 'MANAGE:SUBSCRIBE',
  /** 获取订阅 */
  FETCH_SUBSCRIBE = 'FETCH:SUBSCRIBE',

  /** 操作 Aria2 */
  MANAGE_ARIA2 = 'MANAGE:ARIA2',
}
