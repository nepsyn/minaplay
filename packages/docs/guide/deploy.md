# 部署

## Docker Compose 部署（推荐）

:::tip 提示
如果还没有安装 Docker，请移步 [Get Docker](https://docs.docker.com/get-docker/) 先在部署环境中安装 Docker 服务。
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
$ docker compose up -d
```

## Docker cli 部署

使用 [Docker](https://docs.docker.com/engine/install/) 部署 MinaPlay。
复制以下命令并修改相关配置。

```shell
# 创建网络
$ docker network create minaplay-network 

# 启动 MySQL
$ docker run -d \
  --name minaplay-mysql \
  --network minaplay-network \
  --restart always \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=minaplay \
  mysql:8

# 启动 Redis
$ docker run -d \
  --name minaplay-redis \
  --network minaplay-network \
  --restart always \
  redis:latest

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
  nepsyn/minaplay:latest
```

## 本地部署（不推荐）

### 准备工作

在宿主机环境下安装以下服务。

- [Node.js](https://nodejs.org/en) (版本 >= 18) & [yarn](https://yarnpkg.com/)
- [Aria2](https://github.com/aria2/aria2) (版本 >= 1.36.0)
- [ffmpeg](https://ffmpeg.org/) & [ffprobe](https://ffmpeg.org/)
- [MySQL](https://www.mysql.com/) (版本 >= 8.0)
- [Redis](https://redis.io/) (版本 >= 6.0)

#### 启动服务

- 启动 Aria2 服务并启用 RPC 功能。
- 启动 MySQL 服务并创建 `minaplay` 数据库。
- 启动 Redis 服务。

### 开始部署

克隆或下载本仓库到本地。

```shell
$ git clone https://github.com/nepsyn/minaplay
```

#### 编译服务端

1. 使用包管理器安装依赖。

    ```shell
    $ cd minaplay/packages/server
    $ yarn
    $ yarn add sharp --ignore-engines
    $ yarn global add @nestjs/cli
    ```

    :::warning 注意
    部分情况下， 依赖 Mediasoup 会安装不成功。可以参考如下的解决方法：

    - 重新执行安装。

        ```shell
        $ MEDIASOUP_WORKER_BIN=1 yarn install
        ```

    - 访问 [Mediasoup 源码仓库发布页](https://github.com/versatica/mediasoup/releases/) 。
    - 下载对应平台的预编译文件压缩包。
    - 创建目录 `node_modules/mediasoup/worker/out/Release` 。
    - 解压压缩包中的可执行文件到 `node_modules/mediasoup/worker/out/Release` 目录下。
    - 为可执行文件添加执行权限。
    :::


2. 复制并修改配置文件。

    ```shell
    $ cp .env.template .env
    $ vi .env
    ```

3. 编译 MinaPlay 服务端应用程序。

    ```shell
    $ yarn run build
    ```

#### 编译网页端

1. 使用包管理器安装依赖。

    ```shell
    $ cd ../web
    $ yarn
    ```

2. 编译 MinaPlay 网页应用程序。

    ```shell
    $ yarn run build
    ```

3. 移动编译后文件到后端静态资源文件夹。

    ```shell
    $ mv dist ../server/dist/public
    ```

#### 启动 MinaPlay

```shell
$ cd ../server
$ node dist/main
```
