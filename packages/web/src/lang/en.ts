import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { StatusEnum } from '@/api/enums/status.enum';
import { FileSourceEnum } from '@/api/enums/file-source.enum';
import { AuthActionEnum } from '@/api/enums/auth-action.enum';
import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import { NotificationEventEnum } from '@/api/enums/notification-event.enum';

export default {
  app: {
    name: 'MinaPlay',
    ok: 'OK',
    cancel: 'Cancel',
    on: 'ON',
    off: 'OFF',
    unknown: 'Unknown',
    auto: 'Auto',
    or: 'Or',
    none: 'None',
    loader: {
      loading: 'Loading...',
      error: 'Oops, something went wrong! Please try ',
      all: 'All items loaded',
      empty: 'No items founded',
      notLoaded: 'Data not loaded! Please try ',
      moreBtn: 'Load More',
      retryBtn: 'Reload',
      loadBtn: 'Load',
      itemsPerPage: 'Items Per Page',
      pageText: 'Page {page} of {max}',
    },
    player: {
      danmaku: {
        settings: 'Danmaku Settings',
        fontSize: 'Font Size',
        opacity: 'Opacity',
        shadow: 'Text Shadow',
      },
    },
    input: {
      keyword: 'Keyword',
      placeholder: 'Find {item}...',
      sort: 'Sort By',
      order: 'Order By',
      status: 'Status',
      unselected: 'Unselected',
      desc: 'DESC',
      asc: 'ASC',
    },
    entities: {
      user: 'User',
      source: 'RSS source',
      rule: 'Subscribe rule',
      download: 'Download item',
      live: 'Live room',
      media: 'Media',
      series: 'Series',
      episode: 'Episode',
      file: 'File',
      notificationMeta: 'Notification Service',
    },
    actions: {
      add: 'New',
      save: 'Save',
      reset: 'Reset',
      delete: 'Delete',
      edit: 'Edit',
      clear: 'Clear All',
      close: 'Close',
      view: 'View',
      retry: 'Retry',
      refresh: 'Refresh',
      upload: 'Upload',
      download: 'Download',
      select: 'Select',
      selectAll: 'Select All',
      unselectAll: 'Unselect All',
      send: 'Send',
      more: '[more]',
      collapse: '[collapse]',
      pause: 'Pause',
      unpause: 'Unpause',
      cancel: 'Cancel',
      copy: 'Copy',
      saveToast: 'Item saved',
      deleteTitle: 'Delete Item Confirm',
      deleteConfirm: 'Are you sure to delete this {item}?',
      deleteToast: 'Item deleted',
    },
  },
  layout: {
    sections: 'Sections',
    dark: 'Dark Mode',
    light: 'Light Mode',
    actions: {
      search: 'Search Resources',
      pluginConsole: 'Plugin Console',
      upload: 'Upload Media Files',
      github: 'Github',
    },
    navs: {
      resource: 'RESOURCES',
      live: 'LIVES',
      source: 'SOURCES',
      rule: 'RULES',
      dashboard: 'DASHBOARD',
      setting: 'SETTINGS',
    },
    user: {
      edit: 'Edit User Profile',
      notification: {
        title: 'Notifications',
        unread: 'Unread',
        read: 'Read',
      },
      logout: {
        title: 'Logout Confirm',
        confirm: 'Are you sure to logout from MinaPlay?',
        btn: 'Logout',
      },
    },
    upload: {
      title: 'Upload Files',
      drop: 'Drop files here to upload',
      closePageHint: 'Closing this page will cancel all upload tasks.',
      cancelTitle: 'Cancel Confirm',
      cancelConfirm: 'Are your sure to cancel this upload?',
      status: {
        finished: 'Finished',
        generating: 'Generating media files',
        sizeExceed: 'File size exceed 10GB',
        canceled: 'Canceled',
        error: 'Unknown error',
      },
    },
    error: {
      back: 'Go Back',
      noPermission: 'No permission to access this page',
      notFound: 'Page not found',
    },
  },
  common: {
    download: {
      title: 'Download',
      item: 'download task',
      sorts: {
        createAt: 'Create Time',
        title: 'Title',
      },
      copyLink: 'Copy Download Link',
      linkCopied: 'Download link copied',
      linkCopyFailed: 'Download link copy failed',
      createAt: 'Create at',
      deleteConfirm: 'Are you sure to delete this download item? This action may cause duplicated download tasks.',
    },
  },
  resource: {
    seriesUpdates: 'Series Updates',
    mediaUpdates: 'Media Updates',
    histories: 'Histories',
    allSeries: 'All Series',
    medias: 'Medias',
    recommendMedias: 'Recommend Medias',
    series: 'Series',
    recommendSeries: 'Recommend Series',
    episodes: 'Episodes',
    information: 'Info',
    noDescription: 'No Description',
    continuePlay: 'Positioned to the last playback location',
    watched: 'Watched',
    episode: {
      next: 'Next',
      previous: 'Prev',
    },
    actions: {
      copy: 'Copy Video URL',
      openInVLC: 'Open in VLC',
      play: 'Play Together',
      watch: 'Watch Now',
    },
  },
  media: {
    entity: {
      name: 'Name',
      description: 'Description',
      isPublic: 'Is Public',
      poster: 'Poster',
      createAt: 'Create At',
    },
  },
  series: {
    seasonLabel: 'Season {season}',
    entity: {
      name: 'Name',
      description: 'Description',
      poster: 'Poster',
      season: 'Season',
      pubAt: 'Publish Date',
      tags: 'Tags',
      count: 'Total Episode Count',
      finished: 'Finished',
      user: 'User',
      createAt: 'Create At',
    },
  },
  episode: {
    entity: {
      title: 'Title',
      no: 'No.',
      series: 'Series',
      media: 'Media',
      pubAt: 'Publish Time',
      createAt: 'Create At',
    },
  },
  user: {
    deleted: 'Deleted User',
    noPermissions: 'No Permissions',
    entity: {
      username: 'Username',
      password: 'Password',
      permissions: 'User Permissions',
      avatar: 'Avatar',
      notify: 'Notify Enabled',
      createAt: 'Create At',
    },
    actions: {
      modifyPermissions: 'Modify Permissions',
      resetPassword: 'Reset Password',
    },
    permission: {
      groups: {
        presets: 'Presets',
        file: 'File',
        media: 'Media',
        series: 'Series',
        subscribe: 'Subscribe',
        live: 'Live',
      },
      presets: {
        administrator: 'Administrator',
        user: 'User',
        guest: 'Guest',
        banned: 'Banned',
      },
      fullAccess: 'Full Access',
      view: 'View',
      uploadVideo: 'Upload Video',
      uploadImage: 'Upload Image',
    },
  },
  source: {
    title: 'RSS Sources',
    unnamed: 'Unnamed RSS source',
    working: 'Working',
    paused: 'Paused',
    nextTriggerTimes: 'Next Parse Times:',
    wrongCronExp: 'Wrong Cron Expression',
    entity: {
      id: 'ID',
      title: 'Title',
      remark: 'Remark',
      cron: 'CRON Expression',
      url: 'URL',
      enabled: 'Enabled',
      user: 'User',
      createAt: 'Create At',
    },
    sections: {
      info: 'Information',
      raw: 'Raw Data',
      log: 'Parse Log',
      download: 'Download',
      rule: 'Rules',
    },
    info: {
      actions: 'Actions',
      update: 'Run Update',
      updateDescription:
        'Run update task instantly, MinaPlay will automatically parse content and download items match your `Rules`.',
      updateBtn: 'Run Update',
      updateToast: 'Run update succeeded',
      enabled: 'Enabled',
      enabledDescription: 'Indicates whether this RSS source is enabled.',
      delete: 'Delete RSS Source',
      deleteDescription: 'Delete this RSS source. Note that this action is irreversible!',
      cronExps: {
        every10Minutes: 'Every 10 Minutes',
        every30Minutes: 'Every 30 Minutes',
        everyHour: 'Every Hour',
        every6Hours: 'Every 6 Hours',
        everyDay: 'Every Day at 0:00',
      },
    },
    raw: {
      parsedView: 'Parsed View',
      rawView: 'Raw View',
      publishAt: 'Publish at:',
      visit: 'Visit Website',
      openPage: 'Open Publish Page',
      download: 'Download on MinaPlay',
      downloadCreated: 'Download task created',
      copyLink: 'Copy Download Link',
      linkCopied: 'Download link copied',
      linkCopyFailed: 'Download link copy failed',
    },
    logs: {
      clearLogsTitle: 'Clear All Confirm',
      clearLogsConfirm: 'Are you sure to clear all logs?',
    },
  },
  rule: {
    title: 'Rules',
    unnamed: 'Unnamed Subscribe Rule',
    entity: {
      id: 'ID',
      remark: 'Remark',
      sources: 'RSS Sources',
      user: 'User',
      createAt: 'Create At',
      updateAt: 'Update At',
    },
    sections: {
      info: 'Information',
      error: 'Error Log',
      download: 'Download',
    },
    info: {
      code: 'Code',
      actions: 'Actions',
      delete: 'Delete Subscribe Rule',
      deleteDescription: 'Delete this subscribe rule. Note that this action is irreversible!',
      duplicate: 'Duplicate Subscribe Rule',
      duplicateDescription: 'Duplicate this subscribe rule, use same code, RSS sources to create a new one.',
      duplicateBtn: 'Duplicate',
      copyLabel: '(Copy)',
    },
    logs: {
      clearLogsTitle: 'Clear All Confirm',
      clearLogsConfirm: 'Are you sure to clear all error logs?',
    },
  },
  file: {
    entity: {
      name: 'Name',
      size: 'Size',
      md5: 'MD5',
      mimetype: 'Mimetype',
      source: 'Source',
      createAt: 'Create At',
    },
    source: {
      [FileSourceEnum.AUTO_GENERATED]: 'Auto Generate',
      [FileSourceEnum.DOWNLOAD]: 'Auto Download',
      [FileSourceEnum.USER_UPLOAD]: 'User Upload',
      other: 'Unknown Source',
    },
  },
  live: {
    title: 'Live Rooms',
    unnamed: 'Unnamed Live Room',
    entity: {
      title: 'Title',
      password: 'Password',
      hasPassword: 'Password Required',
      poster: 'Poster',
      user: 'User',
      stream: 'Stream',
      createAt: 'Create At',
    },
    play: {
      sendChat: 'Send a chat...',
      validateTitle: 'Password Validate',
      validateHint: 'Password validation required',
      validate: 'Validate',
      streamTitle: 'Stream Confirm',
      streamHint: 'Do you want to stream the selected media?',
      disposeTitle: 'Room Closed',
      disposeHint: 'Live room was closed by administrator',
      closeTitle: 'Close Room Confirm',
      closeConfirm: 'Are you sure to close this live room?',
      exit: 'Exit Room',
      password: 'Password',
      cancelPassword: 'Cancel Password',
      passwordLengthRule: 'Password should contain at least 4 characters',
      unknownChatType: 'Unknown chat message type',
      noStream: 'No Streaming Content',
      stopStreaming: 'Stop Streaming',
      stream: {
        'client-sync': 'Client Sync',
        'server-push': 'Server Push',
        'live-stream': 'Live Stream',
        type: 'Type',
        url: 'URL',
      },
      playing: 'Playing: ',
      voice: {
        single: `You've booked the whole live room!`,
        voiceNotConnected: 'Live voice service not connected',
        voiceConnectFailed: 'Live voice service connect failed',
        voiceNotEnabled: 'Audio recording is forbidden',
        join: 'Join Live Voice',
        quit: 'Quit Live Voice',
        muted: 'Muted',
        speaking: 'Speaking',
      },
      tabs: {
        chat: 'Chat',
        voice: 'Voice',
        settings: 'Settings',
      },
      notify: {
        connect: 'Live room connected',
        disconnect: 'Live room disconnected',
        'member-join': 'joined live room',
        'member-quit': 'left live room',
        'member-mute-chat': 'Your chat is muted by live room owner',
        'member-mute-voice': 'Your voice is muted by live room owner',
        'member-kick': `You've been removed from this live room`,
      },
    },
  },
  actionLog: {
    entity: {
      ip: 'IP',
      action: 'Action',
      operator: 'Operator',
      target: 'Target',
      createAt: 'Create At',
    },
    actions: {
      [AuthActionEnum.LOGIN]: 'LOGIN',
      [AuthActionEnum.LOGOUT]: 'LOGOUT',
      [AuthActionEnum.REFRESH]: 'REFRESH TOKEN',
      [AuthActionEnum.GRANT]: 'GRANT PERMISSIONS',
      [AuthActionEnum.CHANGE_PASSWORD]: 'CHANGE PASSWORD',
    },
  },
  plugin: {
    console: 'Plugin Console',
    openConsole: 'Open Plugins Console',
    sendChat: 'Send a chat to plugin console...',
    initializing: 'Plugin console initializing...',
    connectFailed: 'Plugin console connect failed',
    welcome: `Welcome to MinaPlay plugin console.\nType 'help' to show all available commands in MinaPlay plugin console.`,
    official: 'Official Plugin',
    program: 'Provide Program: {program}',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enablePlugin: 'Enable Plugin',
    disablePlugin: 'Disable Plugin',
    uninstallTitle: 'Uninstall Confirm',
    uninstallHint: 'Are you sure to uninstall this plugin?',
    uninstalled: 'Plugin uninstalled',
    entity: {
      repo: 'Source Repository',
      author: 'Author',
      version: 'Version',
      license: 'License',
    },
  },
  dashboard: {
    nav: {
      application: 'Application',
      module: 'Modules',
    },
    system: 'System',
    logs: 'Application Logs',
    actionLogs: 'Auth Action Logs',
    plugins: 'Plugins',
    user: 'Users',
    source: 'Sources',
    rule: 'Rules',
    media: 'Medias',
    series: 'Series',
    episode: 'Episodes',
    live: 'Lives',
    file: 'Files',
  },
  system: {
    usage: 'Usage',
    diskUsage: 'Disk Usage',
    memoryUsage: 'Memory Usage',
    usageLabels: {
      minaplay: 'MinaPlay Used',
      others: 'Others Used',
      free: 'Free',
    },
    workingTime: 'Working Time',
    startTime: 'Start Time',
    workedTime: 'Worked for',
    version: 'Version',
  },
  logs: {
    clearTitle: 'Clear All Confirm',
    clearConfirm: 'Are you sure to clear all logs?',
  },
  settings: {
    title: 'Settings',
    sections: {
      app: 'App Configs',
      profile: 'User Profile',
    },
    app: {
      ui: 'UI Interface',
      language: 'Default Language',
      languageDescription: 'MinaPlay UI interface default language.',
      theme: 'Default Theme',
      themeDescription: 'MinaPlay UI interface default theme.',
      common: 'Common',
      subtitle: 'Show Subtitle',
      subtitleDescription: 'Display video subtitles by default.',
      danmaku: 'Show Danmaku',
      danmakuDescription: 'Play live danmaku by default.',
      joinVoice: 'Auto Join Live Voice',
      joinVoiceDescription: 'Join live voice room by default.',
      autoContinue: 'Auto Resume Playback',
      autoContinueDescription: 'Automatically resume playback from last watched position by default.',
      homepage: 'Homepage Content',
      visiblePlates: 'Visible Plates',
      hiddenPlates: 'Hidden Plates',
      noPlate: 'There seems to be no visible plate',
    },
    profile: {
      basic: 'Basic Info',
      username: 'Username',
      avatar: 'User Avatar',
      uploadAvatar: 'Upload New Avatar',
      globalNotification: 'Global Notification',
      password: 'Password',
      oldPassword: 'Old Password',
      newPassword: 'New Password',
      passwordConfirm: 'Confirm New Password',
      passwordChanged: 'Password changed, Please login again',
      passwordLength: 'Password must be in 6~40 characters',
      passwordMismatch: 'The two passwords do not match',
      changePassword: 'Change Password',
      notification: 'Notification',
      availableAdapters: 'Available Adapters',
      adapters: {
        [NotificationServiceEnum.WS]: 'Client Notification',
        [NotificationServiceEnum.EMAIL]: 'Email Notification',
      },
      editSubscriptions: ' Edit Notification Subscriptions',
      subscriptions: {
        [NotificationEventEnum.NEW_MEDIA]: 'New Media Updated',
        [NotificationEventEnum.NEW_EPISODE]: 'New Series Episode Updated',
      },
      email: {
        address: 'Email Address',
        sendCode: 'Send Verification Code',
        resend: 'Resend in {timeout} seconds',
        verifyCode: 'Email Verification Code',
        verify: 'Verify',
      },
    },
  },
  login: {
    username: 'Username',
    password: 'Password',
    hint: 'Login to MinaPlay',
    btn: 'Login',
  },
  utils: {
    copied: 'Copied to clipboard.',
    copyFailed: 'Copy failed!',
  },
  status: {
    [StatusEnum.PENDING]: 'Running',
    [StatusEnum.SUCCESS]: 'Success',
    [StatusEnum.PAUSED]: 'Paused',
    [StatusEnum.FAILED]: 'Failed',
    unknown: 'Unknown',
  },
  notification: {
    markAsRead: 'Mark as Read',
    markAsUnread: 'Mark as Unread',
    titles: {
      [NotificationEventEnum.NEW_MEDIA]: 'New Media Updated',
      [NotificationEventEnum.NEW_EPISODE]: 'New Episode Updated',
    },
    descriptions: {
      [NotificationEventEnum.NEW_MEDIA]: `A new media "{name}" updated in MinaPlay.`,
      [NotificationEventEnum.NEW_EPISODE]: `A new episode "{series} #{no}" updated in MinaPlay.`,
    },
  },
  error: {
    [ErrorCodeEnum.BAD_REQUEST]: 'Request failed! Params invalid',
    [ErrorCodeEnum.INTERNAL_SERVER_ERROR]: 'Request failed! Server is busy',
    [ErrorCodeEnum.QUERY_FAILED]: 'Request failed! Entity is referenced by other entities',
    [ErrorCodeEnum.UNKNOWN_ERROR]: 'Request failed! Unknown Error',
    [ErrorCodeEnum.NO_SYNC_FIELD]: 'Request failed! No sync field',
    [ErrorCodeEnum.NOT_FOUND]: 'Request failed! Resource not found',
    [ErrorCodeEnum.TIMEOUT]: 'Request timeout! Please try again later',
    [ErrorCodeEnum.NOT_IMPLEMENTED]: 'Request failed! Action not implemented',
    [ErrorCodeEnum.WRONG_USERNAME_OR_PASSWORD]: 'Wrong username or password',
    [ErrorCodeEnum.USER_NOT_LOGGED_IN]: 'User not logged in',
    [ErrorCodeEnum.NO_PERMISSION]: 'Operation not permitted',
    [ErrorCodeEnum.INVALID_TOKEN]: 'Token is expired or invalid',
    [ErrorCodeEnum.USERNAME_ALREADY_OCCUPIED]: 'Username is already occupied',
    [ErrorCodeEnum.INVALID_FILE]: 'Wrong file type',
    [ErrorCodeEnum.INVALID_IMAGE_FILE_TYPE]: 'Wrong file content',
    [ErrorCodeEnum.INVALID_VIDEO_FILE_TYPE]: 'Wrong file content',
    [ErrorCodeEnum.DUPLICATE_SERIES]: 'Duplicated series name',
    [ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT]: 'Subscribe source format is invalid RSS',
    [ErrorCodeEnum.INVALID_SUBSCRIBE_RULE_CODE]: 'Subscribe rule code is invalid',
    [ErrorCodeEnum.DUPLICATED_DOWNLOAD_ITEM]: 'Duplicated download item',
    [ErrorCodeEnum.USER_CHAT_MUTED]: 'User chat is muted by room owner',
    [ErrorCodeEnum.USER_VOICE_MUTED]: 'User voice is muted by room owner',
    [ErrorCodeEnum.VOICE_SERVICE_ESTABLISH_FAILED]: 'User voice initialize failed',
    [ErrorCodeEnum.WRONG_LIVE_PASSWORD]: 'Wrong live password',
    [ErrorCodeEnum.DUPLICATED_CONNECTION]: 'Duplicated live connection',
    [ErrorCodeEnum.DUPLICATED_NOTIFICATION_SERVICE]: 'Duplicated notification service',
    [ErrorCodeEnum.WRONG_EMAIL_VERIFY_CODE]: 'Wrong email verify code',
    [ErrorCodeEnum.BUILTIN_PLUGIN_NOT_UNINSTALLABLE]: 'Builtin plugins are not uninstallable',
    other: 'Request failed! Please try again later',
  },
};
