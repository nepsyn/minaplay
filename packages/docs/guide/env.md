# 启动参数

MinaPlay 启动时会读取当前环境变量中的启动参数。
全部的选项列表可在 [.env.template](https://github.com/nepsyn/minaplay/blob/master/packages/server/.env.template) 文件中查看。

## 配置说明

| 参数名                      | 说明                                   | 默认值                                                                      |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| APP_ENV                     | 应用程序环境                           | ` prod `                                                                    |
| APP_HOST                    | 应用程序监听地址                       | `0.0.0.0`                                                                   |
| APP_PORT                    | 应用程序监听端口                       | `3000`                                                                      |
| APP_SECRET_KEY              | 应用程序密钥（缺省时自动生成）         | 缺省                                                                        |
| APP_HTTP_PROXY              | 应用程序代理地址                       | 缺省                                                                        |
| APP_ENABLE_CORS             | 是否允许跨域请求                       | `1`                                                                         |
| FFMPEG_PATH                 | ffmpeg可执行文件路径                   | `ffmpeg`                                                                    |
| FFPROBE_PATH                | ffprobe可执行文件路径                  | `ffprobe`                                                                   |
| DB_HOST                     | MySQL 地址                             | `localhost`                                                                 |
| DB_PORT                     | MySQL 端口                             | `3306`                                                                      |
| DB_USERNAME                 | MySQL 用户                             | `root`                                                                      |
| DB_PASSWORD                 | MySQL 密码                             | 缺省                                                                        |
| DB_DATABASE                 | MySQL 数据库                           | `minaplay`                                                                  |
| REDIS_HOST                  | Redis 地址                             | `localhost`                                                                 |
| REDIS_PORT                  | Redis 端口                             | `6379`                                                                      |
| REDIS_DB                    | Redis 数据库                           | `0`                                                                         |
| REDIS_PASSWORD              | Redis 密码                             | 缺省                                                                        |
| ARIA2_RPC_HOST              | Aria2 RPC 地址                         | `127.0.0.1`                                                                 |
| ARIA2_RPC_PORT              | Aria2 RPC 端口                         | `6800`                                                                      |
| ARIA2_RPC_PATH              | Aria2 RPC 路径                         | `/jsonrpc`                                                                  |
| ARIA2_RPC_SECRET            | Aria2 RPC 密码                         | 缺省                                                                        |
| ARIA2_AUTO_UPDATE_TRACKER   | Aria2 是否自动更新 trackers            | `1`                                                                         |
| ARIA2_TRACKER_LIST_URL      | Aria2 自动更新 trackers 链接           | `https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_best.txt` |
| MS_ANNOUNCED_IP             | 宿主机外网 IP （用于 WebRTC 语音服务） | `127.0.0.1`                                                                 |
| MS_RTC_MIN_PORT             | RTC 端口范围最小值                     | `12000`                                                                     |
| MS_RTC_MAX_PORT             | RTC 端口范围最大值                     | `12999`                                                                     |
| MS_WORKERS_NUM              | Mediasoup 工作进程数量                 | `4`                                                                         |
| MS_AUDIO_CLOCK_RATE         | Mediasoup 语音时钟周期                 | `48000`                                                                     |
| MS_AUDIO_CHANNELS           | Mediasoup 语音声道数                   | `2`                                                                         |
| MS_AUDIO_MAX_INCOME_BITRATE | Mediasoup 最大比特率                   | `1500000`                                                                   |
| STREAM_RTMP_PORT            | NodeMediaServer RTMP 端口              | `1935`                                                                      |
| STREAM_HTTP_PORT            | NodeMediaServer HTTP 端口              | `3001`                                                                      |
| STREAM_CHUNK_SIZE           | NodeMediaServer CHUNK 大小             | `60000`                                                                     |
| STREAM_PUBLISH_KEY          | NodeMediaServer 推流密钥               | 缺省                                                                        |
| NOTIFY_WS                   | 是否启用 Websocket 通知                | `1`                                                                         |
| NOTIFY_EMAIL                | 是否启用电子邮件通知                   | `0`                                                                         |
| NOTIFY_EMAIL_SMTP_HOST      | SMTP 地址                              | `mail.example.com`                                                          |
| NOTIFY_EMAIL_SMTP_PORT      | SMTP 端口                              | `25`                                                                        |
| NOTIFY_EMAIL_SMTP_SECURE    | SMTP 是否使用安全协议                  | `0`                                                                         |
| NOTIFY_EMAIL_SMTP_USER      | SMTP 用户                              | `no-reply@example.com`                                                      |
| NOTIFY_EMAIL_SMTP_PASSWORD  | SMTP 密码                              | `password`                                                                  |
| NOTIFY_EMAIL_ORIGIN         | SMTP 发信来源                          | `MinaPlay <minaplay@example.com>`                                           |
| NOTIFY_EMAIL_SUBJECT        | SMTP 发信主题                          | `MinaPlay Email Notification`                                               |

## 应用配置

### Docker Compose 应用配置

```yaml
version: '3.8'

services:
  ...
  
  minaplay:
    ...
    environment: // [!code focus:5]
      - DB_HOST=minaplay-mysql
      - REDIS_HOST=minaplay-redis
      - MS_ANNOUNCED_IP=127.0.0.1
      - CUSTOM_KEY=CUSTOM_VALUE # 用户自定义的配置 // [!code ++]
    ...

networks:
  minaplay-network:
```

### Docker cli 应用配置

```shell {13}
# 启动 MinaPlay
# 在需要放映室语音通话服务的情况下，将命令中 `-e MS_ANNOUNCED_IP=127.0.0.1` 更改为宿主机的外部访问 IP 地址
$ docker run -d \
  --name minaplay \
  --network minaplay-network \
  --restart unless-stopped \
  -v ./data:/app/data \
  -p 3000:3000 \
  -p 12000-12999:12000-12999 \
  -e DB_HOST=minaplay-mysql \
  -e REDIS_HOST=minaplay-redis \
  -e MS_ANNOUNCED_IP=127.0.0.1 \
  -e CUSTOM_KEY=CUSTOM_VALUE \
  nepsyn/minaplay:latest
```

### 宿主机启动应用配置

- 直接更改目录下 `.env` 文件。

```shell
$ cd minaplay/packages/server
$ vi .env
```

- 使用命令行环境变量。

```shell {2}
$ cd minaplay/packages/server
$ CUSTOM_KEY=CUSTOM_VALUE node dist/main
```
