<script lang="ts" setup>
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import axios from 'axios';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useRouter } from 'vue-router';
import UploadDrawer from '@/components/app/UploadDrawer.vue';
import MessagesContainer from '@/components/app/MessagesContainer.vue';
import { onBeforeMount } from 'vue';

const app = useApp();
const router = useRouter();

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
    } else {
      return Promise.reject(error);
    }
  },
);

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
