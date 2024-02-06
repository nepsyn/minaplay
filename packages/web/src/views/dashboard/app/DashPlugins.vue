<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="secondary-darken-2" :prepend-icon="mdiConsole">
          {{ t('plugin.openConsole') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-text-field
          variant="outlined"
          color="primary"
          :prepend-inner-icon="mdiMagnify"
          hide-details
          :label="t('app.input.keyword')"
          density="compact"
          v-model.trim="filters.keyword"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>
    <multi-items-loader class="pa-0 mt-4" :loader="pluginsLoader" hide-load-more :hide-empty="plugins.length > 0">
      <v-row dense>
        <v-col cols="12" sm="6" md="4" v-for="(plugin, index) in filteredPlugins" :key="index">
          <plugin-overview :plugin="plugin" @update="onPluginUpdate"></plugin-overview>
        </v-col>
      </v-row>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { mdiConsole, mdiMagnify, mdiRefresh } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { computed, ref } from 'vue';
import PluginOverview from '@/components/plugin/PluginOverview.vue';
import { PluginControl } from '@/api/interfaces/plugin.interface';

const { t } = useI18n();
const api = useApiStore();

const filters = ref({
  keyword: '',
});
const pluginsLoader = useAxiosPageLoader(async () => {
  return await api.Plugin.getAll();
});
const { items: plugins, pending: loading, request: loadPlugins, reset } = pluginsLoader;
const filteredPlugins = computed(() => {
  const keyword = filters.value.keyword?.toLowerCase() ?? '';
  return keyword.length > 0
    ? plugins.value.filter(
        ({ id, description }) => id.toLowerCase().includes(keyword) || description?.toLowerCase().includes(keyword),
      )
    : plugins.value;
});
const request = () => {
  reset();
  loadPlugins();
};

const onPluginUpdate = (plugin: PluginControl) => {
  const index = plugins.value.findIndex(({ id }) => id === plugin.id);
  if (index >= 0) {
    plugins.value[index] = plugin;
  }
};
</script>

<style scoped lang="sass"></style>
