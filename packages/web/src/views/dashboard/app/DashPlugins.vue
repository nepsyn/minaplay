<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <multi-items-loader class="pa-0 mt-4" :loader="pluginsLoader" hide-load-more :hide-empty="plugins.length > 0">
      <v-row dense>
        {{ plugins }}
      </v-row>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { mdiRefresh } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';

const { t } = useI18n();
const api = useApiStore();

const pluginsLoader = useAxiosPageLoader(async () => {
  return await api.Plugin.getAll();
});
const { items: plugins, pending: loading, request: loadPlugins, reset } = pluginsLoader;
const request = () => {
  reset();
  loadPlugins();
};
</script>

<style scoped lang="sass"></style>
