<script lang="ts" setup>
import { useApp } from '@/store/app';
import { onBeforeMount } from 'vue';
import { Api } from '@/api/api';
import axios from 'axios';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useRouter } from 'vue-router';

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
        localStorage.removeItem('token');
        router.replace({ name: 'login' });
      }
      return Promise.reject(error);
    },
  );
});
</script>

<template>
  <router-view />
  <v-snackbar v-model="app.snackbar.show" :color="app.snackbar.color" timeout="2000" location="bottom right">
    {{ app.snackbar.message }}
  </v-snackbar>
</template>

<style scoped></style>
