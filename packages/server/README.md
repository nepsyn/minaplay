<div align="center">

<img width="100" src="../../assets/minaplay.svg" alt="logo">
<br/>
<img width="200" src="../../assets/minaplay.png" alt="title">

----

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具

MinaPlay server 属于 [MinaPlay](../../README.md) 项目的一部分

</div>

## 项目说明

MinaPlay 是一个用于追番 / 追剧的个人媒体库。MinaPlay 根据用户创建的 RSS 订阅源、订阅规则自动下载媒体文件并生成描述信息。

MinaPlay server 是 MinaPlay 使用 [NestJS](https://nestjs.com/) + [TypeORM](https://typeorm.io/)
构建的服务器端，使用 [MySQL](https://www.mysql.com/) 作为数据库。
我们欢迎各种形式的贡献，如果您有比较好的想法和建议，欢迎提出 issue。

## 构建过程

### 项目依赖

- [Node.js](https://nodejs.org/en) (版本 >= 18) & [yarn](https://yarnpkg.com/)
- [Aria2](https://github.com/aria2/aria2) (版本 >= 1.36.0)
- [ffmpeg](https://ffmpeg.org/) & [ffprobe](https://ffmpeg.org/)
- [MySQL](https://www.mysql.com/) (版本 >= 8.0)
- [Redis](https://redis.io/) (版本 >= 6.0)

### 开始

1. 克隆或下载本仓库到本地。

   ```shell
    git clone https://github.com/nepsyn/minaplay
    cd minaplay/packages/server
    ```
2. 使用包管理器安装依赖。

    ```shell
    yarn
    yarn add sharp --ignore-engines
    yarn global add @nestjs/cli
    ```

   部分情况下， 依赖 Mediasoup 会安装不成功。可以参考如下的解决方法：
    1. 重新执行安装。

        ```shell
         MEDIASOUP_WORKER_BIN=1 yarn install --ignore-engines
        ```

    2. 访问 [Mediasoup 源码仓库发布页](https://github.com/versatica/mediasoup/releases/) 。
    3. 下载对应平台的预编译文件压缩包。
    4. 创建目录 `node_modules/mediasoup/worker/out/Release` 。
    5. 解压压缩包中的可执行文件到 `node_modules/mediasoup/worker/out/Release` 目录下。
    6. 为可执行文件添加执行权限。

3. 复制并修改配置文件。

    ```shell
    cp .env.template .env
    vi .env
    ```

4. 在本地开发环境启动 MinaPlay 应用程序。

    ```shell
    yarn run start
    ```

5. 编译 MinaPlay 应用程序。

    ```shell
    yarn run build
    ```

## 目录结构

``` 
├── data                            # 应用程序数据目录
│   ├── download                    # 下载文件目录
│   ├── generated                   # 生成资源文件目录
│   ├── plugin                      # MinaPlay 插件文件目录
│   ├── rule                        # 订阅规则代码文件目录
│   └── upload                      # 用户上传文件目录
│       ├── image                   # 用户上传图片文件目录
│       └── video                   # 用户上传视频文件目录
├── dist                            # 编译生成文件目录
├── public                          # 页面目录
└── src                             # 应用程序代码目录
    ├── common
    │   └── messages                # 内置的消息类型
    ├── enums                       # 枚举类型
    ├── interfaces                  # TypeScript 类型定义文件
    ├── migrations                  # TypeORM 数据库迁移文件
    ├── modules
    │   ├── authorization           # 权限验证模块
    │   ├── file                    # 文件模块
    │   ├── live                    # 放映室模块
    │   ├── media                   # 媒体模块
    │   │   ├── episode             # 单集模块
    │   │   ├── series              # 剧集模块
    │   │   └── view-history        # 播放历史模块
    │   ├── notification            # 通知模块
    │   │   └── adapters            # 通知适配器
    │   │       ├── email
    │   │       │   └── templates
    │   │       └── ws
    │   ├── plugin                  # 插件模块
    │   │   └── builtin             # 内置插件
    │   │       ├── help
    │   │       ├── plugin-manager
    │   │       └── user-manager
    │   ├── subscribe               # RSS 订阅模块
    │   │   ├── download            # 订阅下载模块
    │   │   ├── parse-log           # 订阅解析日志模块
    │   │   ├── rule                # 订阅规则模块
    │   │   └── source              # 订阅源模块
    │   ├── system                  # 系统模块
    │   └── user                    # 用户模块
    └── utils                       # 工具代码
```


