<script lang="ts" setup>
import { useApp } from '@/store/app';
import { onBeforeMount } from 'vue';
import { Api } from '@/api/api';
import axios from 'axios';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useRouter } from 'vue-router';
import UploadDrawer from '@/components/app/UploadDrawer.vue';
import MessagesContainer from '@/components/app/MessagesContainer.vue';

const app = useApp();
const router = useRouter();

onBeforeMount(async () => {
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.data?.code === ErrorCodeEnum.INVALID_TOKEN) {
        localStorage.removeItem('minaplay-token');
        app.toastWarning('登录验证已过期，请重新登录');
        router.replace('/login');
      } else {
        return Promise.reject(error);
      }
    },
  );

  const authToken = localStorage.getItem('minaplay-token');
  if (authToken) {
    try {
      Api.setToken(authToken);
      const response = await Api.Auth.refreshToken();
      const { token, ...user } = response.data;
      app.setUser(user);
      Api.setToken(token);
      localStorage.setItem('minaplay-token', token);
    } catch {}
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
