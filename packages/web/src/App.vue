<script lang="ts" setup>
import { useAppStore } from '@/store/app';
import { onBeforeMount } from 'vue';
import { Api } from '@/api/api';

const app = useAppStore();

onBeforeMount(async () => {
  const authToken = localStorage.getItem('token');
  if (authToken) {
    Api.setToken(authToken);
  }
});
</script>

<template>
  <router-view />
  <v-snackbar v-model="app.snackbar.show" :color="app.snackbar.color" timeout="2000" location="bottom right">
    {{ app.snackbar.message }}
  </v-snackbar>
</template>

<style scoped></style>
