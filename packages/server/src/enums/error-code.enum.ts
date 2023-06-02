/** 应用程序错误代码 */
export enum ErrorCodeEnum {
  /** 错误的请求 */
  BAD_REQUEST = 0x0001,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 0x0002,
  /** 错误的查询 */
  QUERY_FAILED = 0x0003,
  /** 系统未记录错误 */
  UNKNOWN_ERROR = 0x0004,
  /** 缺少同步字段 */
  NO_SYNC_FIELD = 0x0005,
  /** 请求资源不存在 */
  NOT_FOUND = 0x0006,

  /** 用户名或密码错误 */
  WRONG_USERNAME_OR_PASSWORD = 0x0101,
  /** 用户未登录 */
  USER_NOT_LOGGED_IN = 0x0102,
  /** 用户缺少权限 */
  NO_PERMISSION = 0x0103,
  /** 未经授权的 Token */
  INVALID_TOKEN = 0x0104,

  /** 错误的文件内容 */
  INVALID_FILE = 0x0301,
  /** 错误的图片文件类型 */
  INVALID_IMAGE_FILE_TYPE = 0x0302,
  /** 错误的视频文件类型 */
  INVALID_VIDEO_FILE_TYPE = 0x0303,

  /** 剧集名称已存在 */
  DUPLICATE_SERIES_NAME = 0x0401,
  /** 剧集标签名称已存在 */
  DUPLICATE_SERIES_TAG_NAME = 0x0402,

  /** 订阅源格式错误 */
  INVALID_SUBSCRIBE_SOURCE_FORMAT = 0x0501,
  /** 订阅规则代码错误 */
  INVALID_SUBSCRIBE_RULE_CODE = 0x0502,
}
