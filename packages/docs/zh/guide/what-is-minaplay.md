<script setup>
import {useData, withBase} from 'vitepress';
const data = useData();
</script>

# 什么是 MinaPlay？

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具，专为追番 / 追剧用户量身打造的个人媒体库。
MinaPlay 通过解析 RSS 订阅链接，配合用户自定义订阅规则自动下载、整理媒体资源。

<img :src="data.isDark.value ? withBase('/homepage-dark.png') : withBase('/homepage.png')" alt="homepage" data-zoomable>

## 主要特性

- **追番 / 追剧服务**

  MinaPlay 会根据用户定义规则自动解析下载 RSS 订阅源中的媒体资源并整理剧集。

- **多 RSS 订阅源支持**

  MinaPlay 支持同时解析多个 RSS 订阅源的内容，用户可以自行添加 RSS 订阅源。

- **个性化下载规则**

  MinaPlay 支持用户个性化下载规则，帮助用户排除不必要的媒体资源下载。

- **多用户使用**

  MinaPlay 支持多用户使用，针对每个独立的用户 MinaPlay 提供了独立的剧集订阅、历史记录、消息通知等服务。
  MinaPlay 支持修改用户权限，一次部署多人使用。

- **多人同步观影**

  MinaPlay 提供了同步观影放映室服务，支持多人实时播放、文字聊天和语音聊天。

- **插件支持**

  MinaPlay 提供了简单但强大的插件系统，你可以像使用命令行一样调用各种插件提供的服务。
  通过 MinaPlay 的插件系统，你可以将 MinaPlay 拓展为：

    - 一个特制化的下载器，配合 [Jellyfin](https://jellyfin.org/) 等服务搭建自己的媒体库。
    - 一个追番 / 追剧的日历表，配合多种消息通知让你不错过任何更新。
    - 一个追番 / 追剧的命令行控制台，使用“魔法”驱动 MinaPlay。
    - ...

## 同类项目

开源社区中有许多与 MinaPlay 类似的项目，这里列举一些项目与 MinaPlay 的主要区别，希望你能够找到最适合自己需求的项目。

| 特性 / 项目      | MinaPlay | [AutoBangumi](https://github.com/EstrellaXD/Auto_Bangumi) | [BGmi](https://github.com/BGmi/BGmi) | [Jellyfin](https://github.com/jellyfin/jellyfin) |
|--------------|----------|-----------------------------------------------------------|--------------------------------------|--------------------------------------------------|
| RSS订阅 / 自动下载 | ✔        | ✔                                                         | ✔                                    |                                                  |
| 个性化订阅        | ✔        | ✔                                                         | ✔                                    |                                                  |
| 个性化通知        | ✔        | ✔                                                         | ✔                                    |                                                  |
| 媒体库          | ✔        | ✔                                                         | ✔                                    | ✔                                                |
| 多用户          | ✔        |                                                           |                                      | ✔                                                |
| 自动重命名        |          | ✔                                                         | ✔                                    |                                                  |
| 目录整理         |          | ✔                                                         | ✔                                    |                                                  |
| 实时放映         | ✔        |                                                           |                                      | ✔                                                |
| 实时多人互动       | ✔        |                                                           |                                      |                                                  |
| 插件拓展         | ✔        |                                                           | ✔                                    | ✔                                                |
| 媒体信息刮削       |          |                                                           |                                      | ✔                                                |

## 相关群组

欢迎加入 MinaPlay 的相关讨论群组，你可以在这里提出建议、参与开发、聊天摸鱼~

- [QQ 讨论组](https://qm.qq.com/q/t0QzNLAldm)

## 开源许可

[AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0.en.html)
