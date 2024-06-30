<template>
  <v-app>
    <upload-drawer></upload-drawer>
    <home-view />
  </v-app>
</template>

<script lang="ts" setup>
import HomeView from './View.vue';
import UploadDrawer from '@/components/app/UploadDrawer.vue';
</script>
