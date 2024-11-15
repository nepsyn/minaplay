import { defineConfig } from 'vitepress';
import { zh } from './zh.mjs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'MinaPlay',
  description: 'MinaPlay official document',
  rewrites: {
    'zh/:rest*': ':rest*'
  },
  lastUpdated: true,
  base: '/minaplay/',
  srcExclude: ['README.md'],
  head: [
    ['script', {
      defer: '',
      src: 'https://us.umami.is/script.js',
      'data-website-id': '6de8215f-84d9-4fc9-a6ca-f6850d2ebb2b',
    }],
  ],
  markdown: {
    image: {
      lazyLoading: true,
    },
  },
  locales: {
    root: {
      label: '简体中文',
      ...zh,
    },
    // en: {
    //   label: 'English',
    //   ...en,
    // },
  },
});
