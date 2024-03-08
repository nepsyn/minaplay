import { defineConfig } from 'vitepress';

export const zh = defineConfig({
  lang: 'zh-Hans',
  description: 'MinaPlay 官方说明文档',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/minaplay.svg',
    editLink: {
      text: '在 GitHub 上编辑此页面',
      pattern: 'https://github.com/nepsyn/minaplay/edit/docs/packages/docs/:path',
    },
    outline: {
      label: '页面导航',
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },
    nav: [{ text: '指南', link: '/guide/what-is-minaplay' }],
    sidebar: {
      '/guide/': [
        {
          text: '简介',
          collapsed: false,
          items: [
            { text: '什么是 MinaPlay？', link: '/guide/what-is-minaplay' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '部署', link: '/guide/deploy' },
            { text: '启动参数', link: '/guide/env' },
          ],
        },
        {
          text: '指南',
          collapsed: false,
          items: [
            { text: 'RSS 订阅源', link: '/guide/rss-source' },
            { text: '订阅规则', link: '/guide/rule' },
            { text: '放映室', link: '/guide/live' },
            { text: '插件控制台', link: '/guide/plugin-console' },
          ],
        },
        {
          text: '资源',
          collapsed: false,
          items: [
            { text: 'FAQ', link: '/guide/faq' },
            { text: '常用订阅规则', link: '/guide/common-rules' },
            { text: '代理配置', link: '/guide/proxy' },
          ],
        },
      ],
    },
    footer: {
      message: '基于 AGPL-3.0 发布',
      copyright: `版权所有 © ${new Date().getFullYear()} Nepsyn`,
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/nepsyn/minaplay' }],
  },
});
