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
  /** 处理超时 */
  TIMEOUT = 0x0007,
  /** 未实现 */
  NOT_IMPLEMENTED = 0x0008,

  /** 用户名或密码错误 */
  WRONG_USERNAME_OR_PASSWORD = 0x0101,
  /** 用户未登录 */
  USER_NOT_LOGGED_IN = 0x0102,
  /** 用户缺少权限 */
  NO_PERMISSION = 0x0103,
  /** 未经授权的 Token */
  INVALID_TOKEN = 0x0104,
  /** 用户名已被使用 */
  USERNAME_ALREADY_OCCUPIED = 0x0105,

  /** 错误的文件内容 */
  INVALID_FILE = 0x0301,
  /** 错误的图片文件类型 */
  INVALID_IMAGE_FILE_TYPE = 0x0302,
  /** 错误的视频文件类型 */
  INVALID_VIDEO_FILE_TYPE = 0x0303,

  /** 剧集已存在 */
  DUPLICATE_SERIES = 0x0401,

  /** 订阅源格式错误 */
  INVALID_SUBSCRIBE_SOURCE_FORMAT = 0x0501,
  /** 订阅规则代码错误 */
  INVALID_SUBSCRIBE_RULE_CODE = 0x0502,
  /** 重复下载 */
  DUPLICATED_DOWNLOAD_ITEM = 0x0503,

  /** 用户被禁止发言 */
  USER_CHAT_MUTED = 0x0601,
  /** 用户被禁止语音 */
  USER_VOICE_MUTED = 0x0602,
  /** 直播语音连接建立失败 */
  VOICE_SERVICE_ESTABLISH_FAILED = 0x0603,
  /** 直播房间密码错误 */
  WRONG_LIVE_PASSWORD = 0x0604,
  /** 存在多个连接 */
  DUPLICATED_CONNECTION = 0x0605,

  /** 重复的通知服务 */
  DUPLICATED_NOTIFICATION_SERVICE = 0x0701,
  /** 邮箱验证码错误 */
  WRONG_EMAIL_VERIFY_CODE = 0x0702,

  /** 内置插件不可卸载 */
  BUILTIN_PLUGIN_NOT_UNINSTALLABLE = 0x0801,
}
