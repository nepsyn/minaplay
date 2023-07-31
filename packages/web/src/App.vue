<script lang="ts" setup>
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import axios from 'axios';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useRouter } from 'vue-router';
import UploadDrawer from '@/components/app/UploadDrawer.vue';
import MessagesContainer from '@/components/app/MessagesContainer.vue';
import { onBeforeMount } from 'vue';
import { useTheme } from 'vuetify';

const app = useApp();
const router = useRouter();
const theme = useTheme();

try {
  const themeMedia = matchMedia('(prefers-color-scheme: dark)');
  theme.global.name.value = themeMedia.matches ? 'dark' : 'light';
  app.darkMode = themeMedia.matches;
} catch {}

onBeforeMount(async () => {
  if (Api.isLogin) {
    try {
      const response = await Api.User.getById(Number(localStorage.getItem('minaplay-user')))();
      app.setUser(response.data);
    } catch {
      Api.setToken(null);
      app.setUser(undefined);
      app.toastWarning('登录验证已过期，请重新登录');
      await router.replace('/login');
    } finally {
      axios.interceptors.response.use(
        (response) => {
          return response;
        },
        (error) => {
          if (error.response?.data?.code === ErrorCodeEnum.INVALID_TOKEN) {
            Api.setToken(null);
            app.setUser(undefined);
            app.toastWarning('登录验证已过期，请重新登录');
            router.replace('/login');
          } else if (error.response?.data?.code === ErrorCodeEnum.NO_PERMISSION) {
            app.toastError('没有权限执行该操作');
          } else {
            return Promise.reject(error);
          }
        },
      );
    }
  }
});
</script>

<template>
  <v-layout>
    <upload-drawer></upload-drawer>
    <router-view />
  </v-layout>
  <v-layout>
    <messages-container></messages-container>
  </v-layout>
</template>

<style lang="sass" scoped></style>
