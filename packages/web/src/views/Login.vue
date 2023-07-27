<script lang="ts" setup>
import { ref, Ref } from 'vue';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import LogoLandscape from '@/assets/logo_banner_landscape.jpeg';
import { useRoute, useRouter } from 'vue-router';
import { mdiAccountCircleOutline, mdiEye, mdiEyeOff, mdiLockOutline } from '@mdi/js';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useDisplay } from 'vuetify';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const action: Ref<'login' | 'register'> = ref('login');
const toggleAction = function () {
  action.value = action.value === 'login' ? 'register' : 'login';
};

const username = ref('');
const password = ref('');
const passwordVisible = ref(false);
const loading = ref(false);

const login = async () => {
  loading.value = true;
  try {
    const response = await Api.Auth.login({
      username: username.value,
      password: password.value,
    });
    const { token, ...user } = response.data;
    Api.setToken(token);
    app.setUser(user);

    await router.replace((route.query.redirect_url as string) || '/');
  } catch (error: any) {
    if (error.response?.data?.code === ErrorCodeEnum.WRONG_USERNAME_OR_PASSWORD) {
      app.toastError('用户名或密码错误！');
    } else {
      app.toastError('网络错误，请稍后重试！');
    }
  } finally {
    loading.value = false;
  }
};

const register = async () => {};
</script>

<template>
  <v-container class="d-flex justify-center align-center login-page overflow-y-auto" fluid>
    <v-card :class="display.smAndUp.value ? 'w-50' : 'w-100'">
      <v-img :src="LogoLandscape"></v-img>
      <v-card-title class="d-flex flex-row justify-space-between align-center">
        <span class="py-2" v-if="action === 'login'">登录到 Minaplay</span>
        <span class="py-2" v-else>加入 Minaplay 发现精彩世界！</span>
        <v-btn color="primary" variant="text" @click="toggleAction">
          切换到{{ action === 'login' ? '注册' : '登录' }}
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model.trim="username"
          variant="underlined"
          color="primary"
          autofocus
          label="用户名"
          :prepend-inner-icon="mdiAccountCircleOutline"
          maxlength="40"
        ></v-text-field>
        <v-text-field
          v-model.trim="password"
          variant="underlined"
          color="primary"
          label="密码"
          :prepend-inner-icon="mdiLockOutline"
          :append-inner-icon="passwordVisible ? mdiEyeOff : mdiEye"
          @click:append-inner="passwordVisible = !passwordVisible"
          maxlength="20"
          :type="passwordVisible ? 'text' : 'password'"
          @keypress.enter="action === 'login' ? login() : register()"
        ></v-text-field>
      </v-card-text>
      <div class="pa-3">
        <v-btn :loading="loading" block color="primary" @click="action === 'login' ? login() : register()">
          {{ action === 'login' ? '登录' : '注册' }}
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<style lang="sass" scoped>
.login-page
  width: 100vw
  height: 100vh
</style>
