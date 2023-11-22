<template>
  <v-app>
    <v-container class="d-flex justify-center align-center login-page overflow-y-auto" fluid>
      <v-card :class="display.smAndUp.value ? 'w-50' : 'w-100'">
        <v-img :src="BannerLandscape"></v-img>
        <v-card-title class="d-flex flex-row justify-space-between align-center">
          <span class="py-2">{{ t('login.hint') }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.trim="username"
            variant="underlined"
            color="primary"
            autofocus
            :label="t('login.username')"
            :prepend-inner-icon="mdiAccountCircleOutline"
            maxlength="40"
          ></v-text-field>
          <v-text-field
            v-model.trim="password"
            variant="underlined"
            color="primary"
            :label="t('login.password')"
            :prepend-inner-icon="mdiLockOutline"
            :append-inner-icon="passwordVisible ? mdiEyeOff : mdiEye"
            @click:append-inner="passwordVisible = !passwordVisible"
            maxlength="20"
            :type="passwordVisible ? 'text' : 'password'"
            @keydown.enter="login"
          ></v-text-field>
        </v-card-text>
        <div class="pa-3">
          <v-btn :loading="pending" block color="primary" @click="login">{{ t('login.btn') }}</v-btn>
        </div>
      </v-card>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { ref } from 'vue';
import { mdiAccountCircleOutline, mdiEye, mdiEyeOff, mdiLockOutline } from '@mdi/js';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { useI18n } from 'vue-i18n';
import { MessageSchema } from '@/lang';
import { useRoute, useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import { useToastStore } from '@/store/toast';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import BannerLandscape from '@/assets/banner-landscape.jpeg';

const { t } = useI18n<{ message: MessageSchema }>();
const display = useDisplay();
const api = useApiStore();
const router = useRouter();
const route = useRoute();
const toast = useToastStore();

const username = ref('');
const password = ref('');
const passwordVisible = ref(false);
const {
  request: login,
  pending,
  onResolved: onLoginResolved,
  onRejected: onLoginRejected,
} = useAxiosRequest(async () => {
  return await api.Auth.login({
    username: username.value,
    password: password.value,
  });
});
onLoginResolved(async (data) => {
  const { token, ...user } = data;
  api.setToken(token);
  api.user = user;
  await router.replace((route.query.redirectUrl as string) || '/');
});
onLoginRejected(async (error) => {
  const content =
    error instanceof AxiosError && error.response?.data?.code
      ? t(`error.${error.response?.data?.code}`)
      : t(`error.${ErrorCodeEnum.BAD_REQUEST}`);
  toast.toastError(content);
});
</script>

<style scoped lang="sass">
.login-page
  width: 100vw
  height: 100vh
</style>
