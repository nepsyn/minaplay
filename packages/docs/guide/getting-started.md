# 快速开始

## 部署

推荐使用 [Docker](https://docs.docker.com/get-docker/) 一键安装 MinaPlay。

:::tip 提示
对于其他部署方式，请参阅 [部署](/guide/deploy) 章节。
:::

将以下代码保存到文件 `docker-compose.yml` 中。

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
    image: "nepsyn/minaplay:beta"
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
$ docker compose up -d
```

:::tip 提示
完整的应用程序启动配置请参阅 [启动参数](/guide/env) 章节。
:::

## 开始使用

首次启动时，系统将会打印默认超级管理员 minaplay 用户及其密码，可通过命令 `docker logs minaplay` 查看。

```
[Nest] 14  - 02/28/2024, 3:25:37 PM     LOG [UserManagerPlugin] Default root user created, username: minaplay, password: xxxxxxx
```

启动成功后，在浏览器中访问 `http://127.0.0.1:3000` 即可跳转到 MinaPlay 的登录页面。

## 下一步

- 完整的应用程序启动配置，请参阅 [启动参数](/guide/env) 章节。
- 要了解如何配置 RSS 订阅源，请参阅 [RSS 订阅源](/guide/rss-source) 章节。
- 要探索如何编写订阅规则，请参阅 [订阅规则](/guide/rule) 章节。
- 如果想要创建同步观影放映室，请参阅 [放映室](/guide/live) 章节。
- 如果要掌握使用 MinaPlay 插件的技巧，请参阅 [插件](/guide/plugin) 章节。
