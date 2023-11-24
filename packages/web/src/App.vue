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
import { onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const toast = useToastStore();
const { t } = useI18n();
const layout = useLayoutStore();
const api = useApiStore();
const router = useRouter();
const route = useRoute();

try {
  const themeMedia = matchMedia('(prefers-color-scheme: dark)');
  layout.toggleDarkMode(themeMedia.matches);
} catch {}

onBeforeMount(async () => {
  if (api.isLogin) {
    try {
      const response = await api.User.getProfileById(Number(localStorage.getItem('minaplay-user')))();
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
          } else if (error.response?.data?.code === ErrorCodeEnum.NO_PERMISSION) {
            toast.toastError(t(`error.${ErrorCodeEnum.NO_PERMISSION}`));
          } else {
            return Promise.reject(error);
          }
        },
      );
    }
  }
});
</script>
