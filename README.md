<div align="center">

<img width="100" src="assets/minaplay.svg" alt="logo">
<br/>
<img width="200" src="assets/minaplay.png" alt="title">

----

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具

<img width="1024" src="packages/docs/public/homepage.png">

</div>

## 项目说明

MinaPlay 是一个用于追番 / 追剧的个人媒体库。MinaPlay 根据用户创建的 RSS 订阅源、订阅规则自动下载媒体文件并生成描述信息。

### 主要功能

- 个性化配置 RSS 订阅源、下载规则，打造独一无二属于自己的追番 / 追剧管家。
- 同步观影放映室，支持聊天消息和多人语音，叫上好朋友一起观影共享欢乐。
- 高度可拓展、可自定义模板的应用程序通知服务，新内容的更新时间不再错过。
- 简单易用的插件系统，像使用命令行一样调用各种插件提供的服务。

### 项目文档

[文档传送门](https://nepsyn.github.io/minaplay/)

## 快速开始

### Docker Compose 部署

推荐使用 [Docker Compose](https://docs.docker.com/compose/) 快速部署 MinaPlay。

将以下代码保存到文件 `docker-compose.yml` 中，或直接使用预设的 [docker-compose.yml](docker-compose.yml) 文件。

```yaml
version: '3.8'

services:
  minaplay-mysql:
    image: "mysql:8"
    container_name: minaplay-mysql
    networks:
      - minaplay-network
    environment:
      - TZ=Asia/Shanghai
      - MYSQL_ALLOW_EMPTY_PASSWORD=yes
      - MYSQL_DATABASE=minaplay
    restart: always

  minaplay-redis:
    image: "redis:latest"
    container_name: minaplay-redis
    networks:
      - minaplay-network
    restart: always

  minaplay:
    image: "nepsyn/minaplay:latest"
    container_name: minaplay
    networks:
      - minaplay-network
    volumes:
      - ./data:/app/data
    environment:
      - DB_HOST=minaplay-mysql
      - REDIS_HOST=minaplay-redis
      - MS_ANNOUNCED_IP=127.0.0.1  # 在需要放映室语音通话服务的情况下改为宿主机外部访问 IP
    ports:
      - "3000:3000"
      - "12000-12999:12000-12999"
    depends_on:
      - minaplay-mysql
      - minaplay-redis
    restart: unless-stopped

networks:
  minaplay-network:
```

使用命令运行 MinaPlay 服务。

```shell
docker compose up -d
```

### Docker 部署

使用 [Docker](https://docs.docker.com/engine/install/) 部署 MinaPlay。
复制以下命令并修改相关配置。

```shell
# 创建网络
docker network create minaplay-network 

# 启动 MySQL
docker run -d \
  --name minaplay-mysql \
  --network minaplay-network \
  --restart always \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=minaplay \
  mysql:8

# 启动 Redis
docker run -d \
  --name minaplay-redis \
  --network minaplay-network \
  --restart always \
  redis:latest

# 启动 MinaPlay
# 在需要放映室语音通话服务的情况下，将命令中 `-e MS_ANNOUNCED_IP=127.0.0.1` 更改为宿主机的外部访问 IP 地址
docker run -d \
  --name minaplay \
  --network minaplay-network \
  --restart unless-stopped \
  -v ./data:/app/data \
  -p 3000:3000 \
  -p 12000-12999:12000-12999 \
  -e DB_HOST=minaplay-mysql \
  -e REDIS_HOST=minaplay-redis \
  -e MS_ANNOUNCED_IP=127.0.0.1 \
  nepsyn/minaplay:latest
```

### 开始使用

首次启动时，系统将会打印默认超级管理员 minaplay 用户及其密码，可通过命令 `docker logs minaplay` 查看。

```
[Nest] 14  - 02/28/2024, 3:25:37 PM     LOG [UserManagerPlugin] Default root user created, username: minaplay, password: xxxxxxx
```

启动成功后，在浏览器中访问 `http://127.0.0.1:3000` 即可跳转到 MinaPlay 的登录页面。

### 启动参数

MinaPlay 启动时会读取当前环境变量中的启动参数。
全部的选项列表可在 [packages/server/.env.template](packages/server/.env.template) 文件中查看。

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

## 构建过程

请移步不同子项目的说明文档：

- [MinaPlay server](packages/server/README.md) - MinaPlay 服务器端，用于提供 MinaPlay 的各项服务。
- [MinaPlay web](packages/web/README.md) - MinaPlay 网页端，用于提供 MinaPlay 用户界面。
- [MinaPlay docs](packages/docs/README.md) - MinaPlay 的用户说明文档。

## 相关群组

- [QQ 讨论群](https://qm.qq.com/q/t0QzNLAldm)

## License

[AGPL-3.0 License](LICENSE)
