import { createI18n } from 'vue-i18n';

import enLocale from './en';
import zhLocale from './zh';

export type MessageSchema = typeof enLocale;

const messages = {
  'en-US': enLocale,
  'zh-CN': zhLocale,
};

const getLocale = () => {
  const cookieLanguage = sessionStorage.getItem('language');
  if (cookieLanguage) {
    return cookieLanguage;
  }

  const locale = Object.keys(messages).find((value) => value === navigator.language);
  return locale ?? 'en-US';
};

export default createI18n<[MessageSchema], 'en-US' | 'zh-CN'>({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'en-US',
  messages,
});
