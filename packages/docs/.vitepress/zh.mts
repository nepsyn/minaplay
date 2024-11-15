import { DefaultTheme, defineConfig } from 'vitepress';

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
      level: 'deep',
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },
    nav: nav(),
    sidebar: {
      '/guide/': {
        base: '/guide/',
        items: sidebarGuide(),
      },
      '/reference/': {
        base: 'reference/',
        items: sideBarReference(),
      },
    },
    footer: {
      message: '基于 AGPL-3.0 发布',
      copyright: `版权所有 © ${new Date().getFullYear()} Nepsyn`,
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/nepsyn/minaplay' }],
  },
});

function nav(): DefaultTheme.NavItem[] {
  return [
    { text: '快速开始', link: '/guide/getting-started' },
    { text: '指南', link: '/guide/rss-source' },
    { text: '参考', link: '/reference/notification' },
  ];
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '简介',
      collapsed: false,
      items: [
        { text: '什么是 MinaPlay？', link: 'what-is-minaplay' },
        { text: '快速开始', link: 'getting-started' },
        { text: '部署', link: 'deploy' },
      ],
    },
    {
      text: '指南',
      collapsed: false,
      items: [
        { text: 'RSS 订阅', link: 'subscribe' },
        { text: '放映室', link: 'live' },
        { text: '插件', link: 'plugin' },
      ],
    },
    {
      text: '资源',
      collapsed: false,
      items: [
        { text: '启动参数', link: 'env' },
        { text: 'FAQ', link: 'faq' },
        { text: '常用订阅规则', link: 'common-rules' },
        { text: '代理配置', link: 'proxy' },
      ],
    },
  ];
}

function sideBarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '参考',
      collapsed: false,
      items: [{ text: '通知服务', link: 'notification' }],
    },
  ];
}
