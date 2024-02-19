import { defineStore } from 'pinia';
import { LANGUAGES, MessageLocale } from '@/lang';
import { ref, watch } from 'vue';

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  locale: MessageLocale;

  showSubtitle: boolean;
  showDanmaku: boolean;
  autoJoinVoice: boolean;
  plates: Array<'series-update' | 'history' | 'media-update' | string>;
}

export const useSettingsStore = defineStore('settings', () => {
  let localSettings = undefined;
  try {
    localSettings = JSON.parse(localStorage.getItem('minaplay-settings') as string);
  } catch {}

  const settings = ref<AppSettings>(
    Object.assign(
      {
        theme: 'auto',
        locale: Object.keys(LANGUAGES).find((value) => value === navigator.language),
        showSubtitle: true,
        showDanmaku: true,
        autoJoinVoice: false,
        plates: ['series-update', 'history', 'media-update'],
      },
      localSettings,
    ),
  );

  watch(
    () => settings.value,
    () => {
      localStorage.setItem('minaplay-settings', JSON.stringify(settings.value));
    },
    {
      deep: true,
    },
  );

  return {
    settings,
  };
});
