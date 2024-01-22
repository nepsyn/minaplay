import { createI18n } from 'vue-i18n';

import enLocale from './en';
import zhLocale from './zh';

export type MessageSchema = typeof enLocale;

export const LANGUAGES = {
  'en-US': enLocale,
  'zh-CN': zhLocale,
};

export type MessageLocale = keyof typeof LANGUAGES;

export default createI18n<[MessageSchema], 'en-US' | 'zh-CN'>({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: LANGUAGES,
});
