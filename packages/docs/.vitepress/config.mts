import { defineConfig } from 'vitepress';
import { zh } from './zh.mjs';
import { en } from './en.mjs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'MinaPlay',
  description: 'MinaPlay official document',
  lastUpdated: true,
  base: '/minaplay/',
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
