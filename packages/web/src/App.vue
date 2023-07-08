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
  const authToken = localStorage.getItem('token');
  if (authToken) {
    Api.setToken(authToken);
  }

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.data?.code === ErrorCodeEnum.INVALID_TOKEN) {
        localStorage.removeItem('minaplay_token');
        app.toastWarning('登录验证已过期，请重新登录');
        router.replace('/login');
      } else {
        return Promise.reject(error);
      }
    },
  );
});
</script>

<template>
  <router-view />
  <v-layout>
    <upload-drawer></upload-drawer>
    <messages-container></messages-container>
  </v-layout>
</template>

<style lang="sass" scoped></style>
