import { defineConfig } from 'vitepress';
import { zh } from './zh.mjs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'MinaPlay',
  description: 'MinaPlay official document',
  lastUpdated: true,
  base: '/minaplay/',
  srcExclude: ['README.md'],
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
