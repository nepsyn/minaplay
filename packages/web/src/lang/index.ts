import { createI18n } from 'vue-i18n';

import enLocale from './en';
import zhLocale from './zh';

export type MessageSchema = typeof enLocale;

const messages = {
  en: enLocale,
  zh: zhLocale,
};

const getLocale = () => {
  const cookieLanguage = sessionStorage.getItem('language');
  if (cookieLanguage) {
    return cookieLanguage;
  }
  const language = navigator.language.toLowerCase();
  const locales = Object.keys(messages);
  for (const locale of locales) {
    if (language.indexOf(locale) > -1) {
      return locale;
    }
  }
  return 'zh';
};

export default createI18n<[MessageSchema], 'en' | 'zh'>({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'en',
  messages,
});
