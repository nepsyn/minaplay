<script lang="ts" setup>
import { useAppStore } from '@/store/app';

const app = useAppStore();
</script>

<template>
  <router-view />
  <v-snackbar v-model="app.snackbar.show" :color="app.snackbar.color" timeout="2000" location="bottom right">
    {{ app.snackbar.message }}
  </v-snackbar>
</template>

<style scoped></style>
