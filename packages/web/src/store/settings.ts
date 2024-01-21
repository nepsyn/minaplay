import { defineStore } from 'pinia';
import { MessageLocale } from '@/lang';

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  locale: MessageLocale;

  danmakuShow: boolean;
  autoJoinVoice: boolean;
}

export const useSettingsStore = defineStore('settings', () => {});
