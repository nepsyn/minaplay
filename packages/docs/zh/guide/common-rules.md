# 常用订阅规则

这里列举了一些常见的订阅规则，可以根据自己的需要复制修改规则内容。

## 指定剧集下载

此订阅源会根据指定的剧集进行下载，并自动整理成 MinaPlay 中的剧集。

```typescript
// 正则表达式应替换为发布组的标题格式
const regexp = /\[Un-Sub\] NO GAME NO LIVE ([\d.]+)([vV]\d+)? \[1080P\]\[BDRip\]\[AAC AVC\]\[HEVC\]\[CHS\]/;
const hooks: RuleHooks = {
  validate(entry) {
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
        title: entry.title,
        no: groups?.[1],
      },
      overwriteEpisode: true, // 当存在重复单集时覆盖原有单集
    }
  }
}
export default hooks;
```

## 关键词过滤（包含、不包含）

此规则会根据关键词判断是否下载媒体资源，但不会对下载的内容进行整理。

```typescript
// 标题需要包含的内容
const includes = ['1080P', 'CHS'];
// 标题不能包含的内容
const excludes = ['Un-Sub'];
const hooks: RuleHooks = {
  validate: (entry) => {
    return includes.every((text) => entry.title.includes(text))
      && !excludes.some((text) => entry.title.includes(text));
  },
}
export default hooks;
```

## 全部下载

_小孩子才做选择，我全都要！_

此订阅规则会下载订阅源中的所有内容，无论用户是否需要。
__注意__，在普遍情况下，下载订阅源中的所有内容会造成极大的资源开销。
除非您清楚订阅源中的所有内容都是必要的，否则不应该使用本规则。

```typescript
const hooks: RuleHooks = {
  validate: (entry) => {
    return true;
  },
};
export default hooks;
```
