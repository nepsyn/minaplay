<div align="center">

<img width="100" src="../../assets/minaplay.svg" alt="logo">
<br/>
<img width="200" src="../../assets/minaplay.png" alt="title">

----

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具

MinaPlay docs 属于 [MinaPlay](../../README.md) 项目的一部分

</div>

## 项目说明

MinaPlay 是一个用于追番 / 追剧的个人媒体库。MinaPlay 根据用户创建的 RSS 订阅源、订阅规则自动下载媒体文件并生成描述信息。

MinaPlay docs 是 MinaPlay 使用 [VitePress](https://vitepress.dev/zh/) 构建的用户文档。
我们欢迎各种形式的贡献，如果您有比较好的想法和建议，欢迎提出 issue。

## 构建过程

### 项目依赖

- [Node.js](https://nodejs.org/en) (版本 >= 18) & npm

### 开始

1. 克隆或下载本仓库到本地。

   ```shell
    git clone https://github.com/nepsyn/minaplay
    cd minaplay/packages/docs
    ```
2. 使用包管理器安装依赖。

    ```shell
    npm install
    ```

3. 在本地开发环境启动 MinaPlay 文档。

    ```shell
    npm run docs:dev
    ```

4. 编译 MinaPlay 文档

    ```shell
    npm run docs:build
    ```
