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
        localStorage.removeItem('minaplay_token');
        app.toastWarning('登录验证已过期，请重新登录');
        router.replace('/login');
      }
    },
  );
});
</script>

<template>
  <router-view />
  <v-layout>
    <v-layout-item
      class="d-flex flex-column justify-end pointer-events-none"
      :model-value="true"
      position="right"
      size="400"
      style="z-index: 10000"
    >
      <v-container fluid class="px-6 py-8">
        <v-slide-x-reverse-transition group>
          <v-alert
            class="pointer-events-initial mt-2"
            v-for="message in app.messages"
            density="compact"
            :key="message.id"
            :type="message.type"
            :text="message.content"
            closable
            @click:close="app.closeToast(message.id)"
          >
          </v-alert>
        </v-slide-x-reverse-transition>
      </v-container>
    </v-layout-item>
  </v-layout>
</template>

<style lang="sass" scoped>
::v-deep(.v-alert__prepend)
  align-self: center

.pointer-events-none
  pointer-events: none

.pointer-events-initial
  pointer-events: initial
</style>
