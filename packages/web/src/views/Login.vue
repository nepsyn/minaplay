<script lang="ts" setup>
import { ref, Ref } from 'vue';
import { useAppStore } from '@/store/app';
import { Api } from '@/api/api';
import LogoLandscape from '@/assets/logo_banner_landscape.jpeg';
import { useRoute, useRouter } from 'vue-router';

const app = useAppStore();
const route = useRoute();
const router = useRouter();

const action: Ref<'login' | 'register'> = ref('login');
const toggleAction = function () {
  action.value = action.value === 'login' ? 'register' : 'login';
};

const username = ref('');
const password = ref('');
const error: Ref<string | undefined> = ref(undefined);
const loading = ref(false);

const login = async () => {
  error.value = undefined;
  loading.value = true;
  try {
    const response = await Api.Auth.login({
      username: username.value,
      password: password.value,
    });

    const { token, ...user } = response.data;
    app.setUser(user);
    Api.setToken(token);
    localStorage.setItem('token', token);

    await router.replace((route.query.redirect_url as string) || '/');
  } catch (e: any) {
    if (e.response) {
      error.value = '用户名或密码错误！';
    } else {
      error.value = '网络错误，请稍后重试！';
    }
  } finally {
    loading.value = false;
  }
};

const register = async () => {};
</script>

<template>
  <v-container class="d-flex justify-center align-center login-page overflow-y-auto" fluid>
    <v-card width="640">
      <v-img :src="LogoLandscape"></v-img>
      <v-card-title class="d-flex flex-row justify-space-between">
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
          maxlength="20"
        ></v-text-field>
        <v-text-field
          v-model.trim="password"
          variant="underlined"
          color="primary"
          label="密码"
          maxlength="20"
          type="password"
          @keypress.enter="action === 'login' ? login() : register()"
        ></v-text-field>
        <v-alert v-if="error" class="mb-0" text tile type="error">{{ error }}</v-alert>
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
