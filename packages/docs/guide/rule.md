<script setup>
import {useData, withBase} from 'vitepress';
const data = useData();
</script>

# 订阅规则

:::tip 提示
本章节对于没有接触过 JavaScript 编程语言的用户来说可能会有些难以理解，
推荐用户先简单了解 [JavaScript 编程语言](https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/First_steps)。

对于个性化需求不高的普通用户，可以直接参阅 [常用订阅规则](/guide/common-rules) 章节，复制或简单更改代码。
:::

## 概述

订阅规则是 MinaPlay 对 RSS 订阅源进行个性化解析下载的核心板块。
其本质上是一段 JavaScript 代码，通过用户描述的行为控制 MinaPlay 的下载和整理。

在 MinaPlay 解析订阅源时，会把 RSS 包含的每个项目转化为一个 JavaScript 对象，其结构定义如下：

```typescript
interface FeedEntry {
  id: string; // guid
  link?: string; // 原始链接
  title?: string; // 原始标题
  description?: string; // 原始描述
  published?: Date; // 上传时间
}
```

用户可以通过这个对象判断是否应该下载，下载后如何描述该媒体资源文件。
每个订阅规则只需要提供两个函数： `validate` 和 `describe` ，其结构定义如下：

```typescript
/**
 * Validate an RSS feed entry, Returns whether MinaPlay should download this entry
 * @param entry Original RSS feed entry
 */
declare type RuleEntryValidator = (entry: FeedEntry) => boolean | Promise<boolean>;

/**
 * Describe a downloaded media file
 * @param entry Original RSS feed entry
 * @param file Media file
 * @param files Media files in the same download task
 */
declare type RuleFileDescriber = (
  entry: FeedEntry,
  file: FileEntity,
  files: FileEntity[],
) => RuleFileDescriptor | Promise<RuleFileDescriptor>;
```

这里列举一个简单案例，在某 RSS 订阅站点上下载名为《NO GAME NO LIVE》（假设它真的存在）第二集的番剧，并整理成对应的剧集。
我们可以用一段 JavaScript 代码描述这个订阅行为：

```typescript:line-numbers {3,6-14}
const hooks: RuleHooks = {
  validate(entry) {
    return entry.title === '[Un-Sub] NO GAME NO LIVE 02 [1080P][BDRip][AAC AVC][HEVC][CHS]'; // 判断 RSS 项目标题
  },
  describe(entry) {
    return {
      series: {
        name: 'NO GAME NO LIVE', // 剧集名叫 'NO GAME NO LIVE'
      },
      episode: {
        title: entry.title, // 单集名称直接使用 RSS 项目的标题
        no: '02', // 单集的集号
      }
    }
  },
};
export default hooks;
```

其中第 7 行 `validate` 函数用于判断资源是否应该被下载，其返回一个布尔值，当为 `true` 时 MinaPlay 将会下载对应媒体资源。

第 6~14 行 `describe` 函数用于描述下载后的媒体文件，如所属剧集、当前集数等信息。

:::tip 提示
`describe` 函数不是必要的，其主要用于描述下载后的媒体文件的相关信息。
当不提供 `describe` 函数时，MinaPlay 将结合使用订阅项目和本地下载文件生成媒体文件的描述信息。
:::

## 基础使用

RSS 资源站点中用户在发布更新时，新的订阅项目中一般会包含如下的信息：

- __id__ - 该订阅项目的唯一标识符，通常由 RSS 资源站点分配。
- __link__ - 该订阅项目的发布页地址，此发布页通常包含了该资源的详细说明。
- __title__ - 该订阅项目的标题，用于项目的识别和检索。
- __description__ - 该订阅项目的简要说明文本。
- __published__ - 该订阅项目的发布时间。

在 MinaPlay 中，是否下载某个订阅项目可以由这几个信息确定。对于简单的订阅需求甚至可以直接由 `title` 字段确定。

回到刚才的栗子，一个发布组发布了 `title` 为如下文本的 RSS 订阅项目：

```
[Un-Sub] NO GAME NO LIVE 02 [1080P][BDRip][AAC AVC][HEVC][CHS]
```

作为一个订阅项目标题，其包含了资源的一些基础属性，不同的发布组习惯于不同的标题命名规范，但一般都包含了下面所示的信息：


| 内容                | 说明                                             | 常见值                |
| ------------------- | ------------------------------------------------ | --------------------- |
| __[Un-Sub]__        | 发布组名称。Un-Sub 只是一个假设的发布组名称。    | `xxx-sub` `xxx字幕组` |
| __NO GAME NO LIVE__ | 资源对应的媒体文件名称（电影 / 剧集名称）。      |                       |
| __02__              | 资源对应的剧集集号。                             |                       |
| __[1080P]__         | 资源对应媒体文件的视频质量。                     | `1080P` `4K` `720P`   |
| __[BDRip]__         | 资源的具体来源，通常有蓝光光碟、网络下载等来源。 | `BDRip` `WEB-DL`      |
| __[AAC AVC]__       | 资源对应媒体文件的音频格式。                     | `AAC` `AVC` `FLAC`    |
| __[HEVC]__          | 资源对应媒体文件的视频格式。                     | `MP4` `HEVC` `H265`   |
| __[CHS]__           | 资源对应媒体文件携带的字幕语言。                 | `CHS` `CHT` `JP`      |

在此基础之上，我们可以个性化自己的订阅规则，例如下面的订阅规则代码：

```typescript
const hooks: RuleHooks = {
  validate(entry) {
    // 我想要看 1080P 的 《NO GAME NO LIVE》 番剧！但是不要 Un-Sub 发布的版本。
    return entry.title.includes('NO GAME NO LIVE') 
      && entry.title.includes('1080P')
      && !entry.title.includes('Un-Sub');
  },
}
export default hooks;
```

:::danger 重要
订阅规则代码运行在独立的沙箱环境中，不可导入如 `fs`, `axios` 等其他模块。
:::

到此为止，你已经了解了 MinaPlay 订阅规则的工作原理和使用方式，更高级的使用方式等待着你的探索！

## 进阶使用

:::tip 提示
建议读者在阅读本章节前先了解 [正则表达式](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions) 的基础用法。
:::

很多时候用户需要深度定制订阅规则，并同时让 MinaPlay 担任下载后媒体文件的整理工作。
这种情况下，用户需要编写更加复杂的订阅规则代码。

再回到刚才的栗子，多数情况下，发布组发布的资源通常会以统一格式命名，其中只会有集号的变动。
现在我们修改之前的订阅规则，让其支持固定格式的标题解析并详细描述下载的媒体文件。

```typescript
// 编写固定格式的正则表达式
const regexp = /\[Un-Sub\] NO GAME NO LIVE ([\d.]+)([vV]\d+)? \[1080P\]\[BDRip\]\[AAC AVC\]\[HEVC\]\[CHS\]/;
const hooks: RuleHooks = {
  validate(entry) {
    // 只有满足正则表达式才下载。
    return regexp.test(entry.title);
  },
  describe(entry) {
    const groups = entry.title.match(regexp);
    return {
      series: {
        name: 'NO GAME NO LIVE', // 剧集的名称
        season: '01', // 剧集的季度
      },
      episode: {
        title: entry.title, // 单集的标题
        no: groups?.[1], // 单集的集号
      }，
      overwriteEpisode: true, // 当存在重复单集时覆盖原有单集
    }
  }
}
```

可以看到，我们仅仅通过一个正则表达式便完成了指定资源的解析判断和媒体文件描述。

熟悉正则表达式的读者可能注意到，我们使用了表达式 `([\d.]+)([vV]\d+)?` 来确定发布的剧集集号。
这和平常使用的直觉不同，可能有读者会提出疑问：
正常情况下剧集的集号不应该类似于 `01`, `12` 这种数字吗，为什么会用这么复杂的表达式，直接用 `(\d+)` 确定不行吗？

实际上在发布组发布的资源中，可能会存在类似于 `12.5` 这种过渡集号的命名。
如果直接使用表达式 `(\d+)` 进行解析，将会导致 MinaPlay 错误地判断为此集不需要下载，或是解析为错误的集号。
为了考虑到这种过渡集号的命名方式，请尽量使用 `([\d.]+)` 的表达式。

另外，发布组在发布资源时，可能会因为各种因素发布了错误的资源。
遇到这种情况时，发布组通常会在同一 RSS 资源站点发布针对同一资源的修正版本。

举个简单的例子，发布组发布了名为 `NO GAME NO LIVE 02` 的资源（这里省略了其他标题说明文本）。
但在之后发现发布资源的视频文件存在问题，于是发布组发布了一个新的修正资源 `NO GAME NO LIVE 02v2` 。
这种情况下，用户一般需要下载新的媒体资源并且替换原有的错误资源文件，所以我们在集号的正则表达式后面添加了发布版本的正则表达式 `([vV]\d+)?` 。

## 添加订阅规则

:::warning 注意
此操作需要当前登录用户具有 `管理 RSS 订阅源` 的相关权限。
:::

要在 MinaPlay 中添加订阅规则，只需要在管理页面中新建订阅规则即可。
之后填入订阅规则的基本参数，选择绑定 RSS 订阅源，并修改订阅规则代码。

<img :src="data.isDark.value ? withBase('/new-rule-dark.png') : withBase('/new-rule.png')" alt="new rule">

- __备注__ - 订阅规则的备注，通常可以填写规则对应的剧集名称。
- __RSS 订阅源__ - 选择订阅规则的作用范围，此订阅规则只会在选定的 RSS 订阅源被 MinaPlay 解析时生效。
- __代码__ - 订阅规则的代码。

:::tip 提示
订阅规则的代码支持使用 [__TypeScript__](https://www.typescriptlang.org/) 语言编写，
MinaPlay 网页客户端提供的编辑器包含订阅规则完整的类型定义，可以在对应标识符上使用键盘组合键 `Alt + F12` 查看。
:::
