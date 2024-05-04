<script setup>
import {useData, withBase} from 'vitepress';
const data = useData();
</script>

# 快速开始

## 部署 MinaPlay

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
    volumes:
      - mysql-data:/var/lib/mysql

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

volumes:
  mysql-data:

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

## 添加 RSS 订阅源

在 MinaPlay 中的 Web 应用程序界面中，通过左侧导航抽屉切换到 **RSS 订阅源** 页面，点击 **新建** 按钮添加 MinaPlay 中的第一个
RSS 订阅源。
这里以追番网站 [蜜柑计划](https://mikanani.me/) 为例，在新建 RSS 订阅源的信息窗口填入蜜柑计划的 RSS 订阅信息，然后 **保存
** 。

<img :src="data.isDark.value ? withBase('/new-rss-source-dark.png') : withBase('/new-rss-source.png')" alt="new RSS source" data-zoomable>

- **标题** - RSS 订阅源的标题，用户可自行填写。
- **链接** - RSS 订阅源的更新链接，请保证链接可访问并且为正确的 RSS 格式。
- **CRON 表达式** - RSS 订阅源的解析周期，MinaPlay 会按照指定的周期解析 RSS 订阅源内容并下载媒体资源。
- **备注** - RSS 订阅源的备注。

## 添加下载规则

添加 RSS 订阅源后，在左侧菜单切换到 **订阅规则** 页面，点击 **新建** 按钮添加 RSS 订阅源中的一条订阅规则。
这里使用 MinaPlay 提供的 **内容过滤器模板** 订阅包含 “1080P” 、 “HEVC” 文本的 RSS 项目。

<img :src="data.isDark.value ? withBase('/new-rule-dark.png') : withBase('/new-rule.png')" alt="new rule" data-zoomable>

- **备注** - 订阅规则的备注。
- **RSS 订阅源** - 订阅规则所属的 RSS 订阅源，可同时选择多个。
- **代码** - 描述具体订阅行为的 JavaScript/TypeScript 代码，编写方式可参考 [订阅规则](/guide/rule) 章节。

## 下一步

- 完整的应用程序启动配置，请参阅 [启动参数](/guide/env) 章节。
- 要了解如何配置 RSS 订阅源，请参阅 [RSS 订阅源](/guide/rss-source) 章节。
- 要探索如何编写订阅规则，请参阅 [订阅规则](/guide/rule) 章节。
- 如果想要创建同步观影放映室，请参阅 [放映室](/guide/live) 章节。
- 如果要掌握使用 MinaPlay 插件的技巧，请参阅 [插件](/guide/plugin) 章节。
