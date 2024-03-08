---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "MinaPlay"
  text: "个性化追番 / 追剧管家"
  tagline: 叫上好友，应有尽有！MinaPlay，津津有味！
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/nepsyn/minaplay

features:
  - title: 自动解析
    details: 自动解析 RSS 订阅源，通过订阅规则个性化自己的追番 / 追剧媒体库。
  - title: 实时观影
    details: 支持多人实时观影，聊天、弹幕、多人语音，主打一个参与感~
  - title: 插件系统
    details: 简单易用的插件系统，像使用命令行一样调用各种插件提供的服务。
---

<script setup>
import {useData} from 'vitepress';
const data = useData();
</script>

<style>
:root { 
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, deepskyblue, #5672cd 80%); 
}
</style>

<br/>

<img :src="data.isDark.value ? '../assets/homepage-dark.png' : '../assets/homepage.png'" alt="homepage">