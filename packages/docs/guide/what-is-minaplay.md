<script setup>
import {useData, withBase} from 'vitepress';
const data = useData();
</script>

# 什么是 MinaPlay？

MinaPlay 是一个视频聚合 RSS 订阅的自动下载管理工具，专为追番 / 追剧用户量身打造的个人媒体库。
MinaPlay 通过解析 RSS 订阅链接，配合用户自定义订阅规则自动下载、整理媒体资源。

<img :src="data.isDark.value ? withBase('/homepage-dark.png') : withBase('/homepage.png')" alt="homepage">

## 主要功能

- **追番 / 追剧服务**

  MinaPlay 会根据用户定义规则自动解析下载 RSS 订阅源中的媒体资源并整理剧集。
  你可以 **省去** 下面这些繁琐的步骤：

      1. 手动浏览 RSS 源站点并查找想要下载的媒体资源
      2. 复制媒体资源的下载链接或下载网站提供的 Torrent 文件
      3. 在本地的下载工具中创建该媒体资源文件的下载任务
      4. 查找下一个订阅的媒体资源...

- **多用户使用**

  MinaPlay 支持多用户使用，针对每个独立的用户 MinaPlay 提供了独立的剧集订阅、历史记录、消息通知等服务。
  MinaPlay 支持修改用户权限，一次部署多人使用。

- **同步观影放映室**

  MinaPlay 提供了同步观影放映室服务，支持多人实时播放、文字聊天和语音聊天。
  何不叫上好朋友一起分享看番 / 看剧的乐趣？

- **插件支持**

  MinaPlay 提供了简单但强大的插件系统，你可以像使用命令行一样调用各种插件提供的服务。
  通过 MinaPlay 的插件系统，你可以将 MinaPlay 拓展为：

  - 一个特制化的下载器，配合 [Jellyfin](https://jellyfin.org/) 等服务搭建自己的媒体库。
  - 一个追番 / 追剧的日历表，配合多种消息通知让你不错过任何更新。
  - 一个追番 / 追剧的命令行控制台，使用“魔法”驱动 MinaPlay。
  - ...

## 同类项目

开源社区中有许多与 MinaPlay 类似的项目，这里列举一些项目与 MinaPlay 的主要区别，希望你能够找到最适合自己需求的项目。

- **[Jellyfin](https://github.com/jellyfin/jellyfin)**

  Jellyfin 是一个非常优秀的媒体库管理软件，其提供了强大的媒体管理、影视信息刮削等功能并拥有良好的社区生态。

  MinaPlay 与 Jellyfin 最主要的区别在于：
  MinaPlay 是基于 RSS 订阅的自动下载管理工具，没有原生支持分类整理、影视信息刮削等功能；
  而 Jellyfin 负责了对本地媒体文件的分类整理和刮削工作。
  简而言之，MinaPlay 充当了下载服务的角色，而 Jellyfin 负责了对本地媒体资源的归纳整理。

- **[AutoBangumi](https://github.com/EstrellaXD/Auto_Bangumi)**

  AutoBangumi 是一个强大的自动追番工具，其提供了自动下载、补全季度、自动重命名等功能。
  AutoBangumi 配置简单，用户界面友好，降低了大部分用户的使用成本。

  相较于 AutoBangumi， MinaPlay 的可配置项更多，追番规则设置更复杂，提供了丰富的用户个性化配置，但也在一定程度上加重了用户的使用成本。
  另外，MinaPlay 包含原生支持的插件系统，相较于 AutoBangumi 而言 MinaPlay 的可拓展性会更大。

- **[ani-cli](https://github.com/pystardust/ani-cli)**

  ani-cli 是一款非常优雅的在线看番工具，其只需要在控制台输入简单几条命令就可以观看番剧。
  ani-cli 的安装和使用过程足够简单，并且不需要额外的配置。

  ani-cli 播放的媒体资源文件通常是从在线视频网站中爬取下来的，对于媒体文件的品质、字幕语言等需求可能难以同时满足。
  MinaPlay 支持用户定义的下载规则，对于媒体文件的字母语言、文件格式、品质等要求均可由用户自行决定。
