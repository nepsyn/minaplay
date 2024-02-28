<div align="center">

<img width="100" src="../../assets/minaplay.svg" alt="logo">
<br/>
<img width="200" src="../../assets/minaplay.png" alt="title">

----

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具

MinaPlay web 属于 [MinaPlay](../../README.md) 项目的一部分

</div>

## 项目说明

MinaPlay 是一个用于追番 / 追剧的个人媒体库。MinaPlay 根据用户创建的 RSS 订阅源、订阅规则自动下载媒体文件并生成描述信息。

MinaPlay server 是 MinaPlay
使用 [Vue](https://vuejs.org/) + [Vuetify](https://vuetifyjs.com/) + [Vite](https://vitejs.dev/) 构建的应用程序界面。
我们欢迎各种形式的贡献，如果您有比较好的想法和建议，欢迎提出 issue。

## 构建过程

### 项目依赖

- [Node.js](https://nodejs.org/en) & [yarn](https://yarnpkg.com/)

### 开始

1. 克隆或下载本仓库到本地。

   ```shell
    git clone https://github.com/nepsyn/minaplay
    cd minaplay/packages/web
    ```
2. 使用包管理器安装依赖。

    ```shell
    yarn install
    ```

3. 复制并修改配置文件。

    ```shell
    cp .env.template .env
    vi .env
    ```

4. 在本地开发环境启动 MinaPlay 用户界面。

    ```shell
    yarn run dev
    ```

5. 编译 MinaPlay 用户界面

    ```shell
    yarn run build
    ```

## 目录结构

```
├── dev-dist                    # PWA 生成文件目录
├── dist                        # 编译生成文件目录
├── public                      # 公共文件
└── src
    ├── api
    │   ├── enums               # 枚举类型
    │   ├── interfaces          # TypeScript 类型定义文件
    │   └── templates           # 代码模板文件目录
    ├── assets                  # 静态资源
    ├── components              # 控件
    │   ├── app
    │   ├── live
    │   ├── notification
    │   ├── plugin
    │   ├── resource
    │   │   └── plates
    │   ├── rule
    │   ├── source
    │   └── user
    ├── composables             # 组合式函数
    ├── css                     # 样式
    ├── lang                    # i18n
    ├── layouts                 # 布局
    │   ├── home
    │   └── login
    ├── plugins                 # 项目插件
    ├── router                  # 路由
    ├── store                   # 全局状态
    ├── utils                   # 工具代码
    └── views                   # 页面
        ├── common
        ├── dashboard
        │   ├── app
        │   └── modules
        ├── error
        ├── live
        ├── resource
        ├── rule
        ├── setting
        └── source
```
