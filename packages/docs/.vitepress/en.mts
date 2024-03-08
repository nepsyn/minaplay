import { defineConfig } from 'vitepress';

export const en = defineConfig({
  lang: 'en-US',
  description: 'MinaPlay official document',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/minaplay.svg',
    editLink: {
      pattern: 'https://github.com/nepsyn/minaplay/edit/docs/packages/docs/:path',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/nepsyn/minaplay' }],
  },
});
