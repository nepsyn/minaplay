<script setup>
import {useData} from 'vitepress';
const data = useData();
</script>

# RSS 订阅源

## 概述

RSS 是一种内容聚合工具，通常以 XML 为基础协议。
一个 RSS 订阅源中的内容通常有如下格式：

```xml
<rss version="2.0">
    <script/>
    <channel>
        <title>Example RSS Source</title>
        <link>https://example.com/RSS</link>
        <description>Example RSS Source</description>
        <item>
            <guid isPermaLink="false">The guid</guid>
            <link>The link</link>
            <title>The title</title>
            <description>The description</description>
            <torrent xmlns="https://example.com/0.1/">
                <link>The link</link>
                <contentLength>287058176</contentLength>
                <pubDate>2023-12-01T18:27:53.925</pubDate>
            </torrent>
            <enclosure type="application/x-bittorrent" length="287058176" url="The url"/>
        </item>
        <item>...</item>
        <item>...</item>
        <item>...</item>
        <item>...</item>
    </channel>
</rss>
```

在 MinaPlay 中，每个 RSS 订阅源拥有其独立的配置和订阅规则。
MinaPlay 会定期解析 RSS 订阅源的内容，结合用户定义的订阅规则判断资源是否需要下载，并在下载后通过订阅规则整理媒体文件。

## RSS 订阅模式

不同的 RSS 资源站点通常包含多种类型的订阅模式，用户可以根据自身需要选择合适的订阅模式。
此处列举一些常见的订阅模式：

:::tip 提示
RSS 订阅模式是指 RSS 资源站点提供的订阅方式，不是 MinaPlay 提供的功能，不论使用哪种 RSS 订阅模式 MinaPlay 都可以正常解析。
:::

- __列表订阅模式__

  通常情况下可以直接使用资源站提供的默认列表 RSS 订阅源，此类订阅源内容包含了该 RSS 资源站点的所有内容更新。
  
  默认列表订阅通常会包含大量订阅项目，MinaPlay 解析时会检查和匹配所有 RSS 项目，可能会造成 CPU 、内存等服务器资源的浪费。
  如果要节省服务器资源使用，请尽量减少 RSS 订阅源中的订阅项目。

- __个人订阅模式__

  部分 RSS 资源站点提供了用户自定义 RSS 订阅内容的功能，例如在网站页面中选择订阅项目生成个人 RSS 订阅源。
  这种情况下可以避免 MinaPlay 解析大部分无效订阅项目，但需要用户手动配置订阅信息。
  
  这种情况下的 RSS 订阅地址通常会携带用户的登录 Token 或其他身份标识符，如下所示：
  
  ```
  https://xxx.com/rss?token=xxxxxx
  https://xxx.com/rss/latest?token=xxxxxx
  ```

- __条件订阅模式__

  部分 RSS 资源站点提供了条件订阅的功能，如只订阅某个剧集的更新、订阅某个发布组的更新或是订阅某些关键字内容的更新。
  用户可以使用条件订阅有针对性地个性化订阅内容。这种情况下通常需要用户配置多个 RSS 订阅源用以订阅不同属性的媒体资源。

  其 RSS 订阅链接通常携带所订阅内容的相关信息，如下所示：

  ```
  https://xxx.com/series/123456/rss
  https://xxx.com/subs/Un-Sub/rss
  https://xxx.com/rss?keyword=xxxxxx
  ```

## 添加 RSS 订阅源


:::warning 注意
此操作需要当前登录用户具有 `管理 RSS 订阅源` 的相关权限。
:::

要在 MinaPlay 中添加 RSS 订阅源，首先需要在资源聚合站点中复制 RSS 订阅链接。

<div style="display: flex">
    RSS 订阅链接一般会用图标 
    <svg style="margin: 0 5px 0 5px; fill: darkorange" class="icon" viewBox="0 0 1024 1024"  xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M832.512 63.488q26.624 0 49.664 10.24t40.448 27.648 27.648 40.448 10.24 49.664l0 704.512q0 26.624-10.24 49.664t-27.648 40.448-40.448 27.648-49.664 10.24l-704.512 0q-26.624 0-49.664-10.24t-40.448-27.648-27.648-40.448-10.24-49.664l0-704.512q0-26.624 10.24-49.664t27.648-40.448 40.448-27.648 49.664-10.24l704.512 0zM188.416 923.648q19.456 0 36.864-7.168t30.208-19.968 19.968-30.208 7.168-36.864-7.168-36.864-19.968-30.208-30.208-19.968-36.864-7.168q-20.48 0-37.376 7.168t-30.208 19.968-20.48 30.208-7.168 36.864 7.168 36.864 20.48 30.208 30.208 19.968 37.376 7.168zM446.464 897.024l36.864 0q15.36 0 30.208 0.512t31.232 0.512 36.864-1.024q0-93.184-35.84-175.616t-97.28-143.872-143.872-96.768-175.616-35.328q-1.024 24.576-1.024 39.936l0 28.672q0 14.336 0.512 29.184t0.512 37.376q65.536 0 123.392 24.576t100.864 67.584 68.096 100.864 25.088 123.392zM707.584 894.976q36.864 0 49.152 0.512t18.432 1.536 15.872 1.024 41.472-2.048q0-145.408-55.296-272.896t-150.528-222.72-223.232-150.528-273.408-55.296q-1.024 25.6-1.024 36.864l0 16.384q0 4.096 0.512 5.632t0.512 7.168 0.512 18.432 0.512 40.448q119.808 0 224.768 45.056t183.296 123.392 123.392 183.296 45.056 223.744z">
        </path>
    </svg>
    表示。
</div>

之后在 MinaPlay 中新建 RSS 订阅源，你将看到如下的信息参数页面。

<img :src="data.isDark.value ? '../assets/new-rss-source-dark.png' : '../assets/new-rss-source.png'" alt="new rss source">

填入 RSS 订阅源的基本参数并保存信息：

- __标题__ - RSS 订阅源的标题，可以随意填写。
- __链接__ - RSS 订阅源的链接，填入刚才复制的链接地址。
- __CRON 表达式__ - MinaPlay 检查 RSS 订阅源内容更新的时间周期。
- __备注__ - RSS 订阅源的用户备注，可以随意填写。

:::tip 提示
- RSS 订阅源链接内容应包含每一项的下载地址，否则 MinaPlay 将无法下载对应媒体资源。
- CRON 表达式的周期越短，服务器资源消耗越大，请尽量避免使用过短周期。
- 确保 RSS 订阅链接内容可以被 [GET 请求](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/GET) 正常访问。对于需要配置额外请求参数或需要代理网络配置的 RSS 订阅源，请参阅 [代理配置](/guide/proxy) 章节。
:::

之后在 __操作__ 板块中启用此订阅源。

## RSS 订阅源操作

MinaPlay 中订阅源支持如下的基础操作：

- __更新__ - 忽略用户定义的 CRON 表达式周期，立即执行更新，MinaPlay 将会自动下载符合您定义的 [订阅规则](/guide/rule) 的媒体资源文件。
- __启用状态__ - 启用或关闭此 RSS 订阅源的解析和下载。
- __删除订阅源__ - 在 MinaPlay 中删除此 RSS 订阅源。

此外，MinaPlay 还支持手动查看订阅源的原始数据、查看订阅源的解析日志、管理订阅源关联的下载项目以及修改订阅源绑定的订阅规则等操作。
请在订阅源页面下的”菜单“栏中选择对应的功能选项查看。
