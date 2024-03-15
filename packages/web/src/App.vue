<template>
  <router-view />
  <v-layout>
    <messages-container></messages-container>
  </v-layout>
</template>

<script setup lang="ts">
import MessagesContainer from '@/components/app/MessagesContainer.vue';
import { useLayoutStore } from '@/store/layout';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toast';
import { useApiStore } from '@/store/api';
import { onBeforeMount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import * as monaco from 'monaco-editor';
import { useSettingsStore } from '@/store/settings';

const toast = useToastStore();
const { t } = useI18n();
const { settings } = useSettingsStore();
const layout = useLayoutStore();
const api = useApiStore();
const router = useRouter();
const route = useRoute();

try {
  if (settings.theme === 'auto') {
    const themeMedia = matchMedia('(prefers-color-scheme: dark)');
    layout.toggleDarkMode(themeMedia.matches);
  } else {
    layout.toggleDarkMode(settings.theme === 'dark');
  }
} catch {}

watch(
  () => layout.darkMode,
  () => {
    document.getElementsByTagName('html')[0].dataset.codeTheme = layout.darkMode ? 'hljs-dark' : 'hljs-light';
    monaco.editor.setTheme(layout.darkMode ? 'vs-dark' : 'vs');
  },
  { immediate: true },
);

onBeforeMount(async () => {
  if (api.isLogin) {
    try {
      const response = await api.Auth.refreshToken();
      api.user = response.data;
    } catch {
      toast.toastWarning(t(`error.${ErrorCodeEnum.INVALID_TOKEN}`));
      api.setToken(undefined);
      api.user = undefined;
      await router.replace({ path: '/login' });
    } finally {
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.data?.code === ErrorCodeEnum.INVALID_TOKEN) {
            api.setToken(undefined);
            api.user = undefined;
            toast.toastWarning(t(`error.${ErrorCodeEnum.INVALID_TOKEN}`));
            router.replace({ path: '/login', query: { redirectUrl: route.fullPath } });
          } else {
            return Promise.reject(error);
          }
        },
      );
    }
  }
});

onBeforeMount(() => {
  const i18n = useI18n();
  i18n.locale.value = settings.locale;
});
</script>
