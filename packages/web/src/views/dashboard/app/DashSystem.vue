<template>
  <v-container class="d-flex flex-column pa-md-12">
    <single-item-loader class="pa-0" :loader="statusLoader">
      <v-sheet rounded border class="pa-3">
        <span class="text-h6"> Usage </span>
      </v-sheet>
      <v-sheet rounded border class="pa-3 mt-4">
        <span class="text-h6"> Work Time </span>
      </v-sheet>
      <v-sheet rounded border class="pa-3 mt-4">
        <span class="text-h6"> Version </span>
      </v-sheet>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';

const { t } = useI18n();
const api = useApiStore();

const statusLoader = useAxiosRequest(async () => {
  return await api.System.getStatus();
});
const { data: status } = statusLoader;
</script>

<style scoped lang="sass"></style>
