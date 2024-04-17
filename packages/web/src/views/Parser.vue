<template>
  <v-layout class="page-height">
    <v-navigation-drawer class="d-none d-md-flex" mobile-breakpoint="md" location="right">
      <v-list :lines="false" density="compact" nav>
        <v-list-subheader class="font-weight-bold">
          {{ t('parser.available') }}
        </v-list-subheader>
        <multi-items-loader class="pa-0" :loader="pluginsLoader" hide-load-more :hide-empty="plugins.length > 0">
          <v-list-item
            v-for="(parser, index) in parsers"
            :key="index"
            :prepend-avatar="parser.plugin.icon"
            :title="parser.name"
            color="primary"
            :to="`/parser/${parser.plugin.id}/${parser.name}`"
            draggable="false"
          >
            <template #append>
              <v-menu open-on-hover>
                <plugin-overview hide-actions :plugin="parser.plugin"></plugin-overview>
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="small" :icon="mdiInformationVariantCircleOutline"></v-icon>
                </template>
              </v-menu>
            </template>
          </v-list-item>
        </multi-items-loader>
      </v-list>
    </v-navigation-drawer>
    <v-main> </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useApiStore } from '@/store/api';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { computed } from 'vue';
import PluginOverview from '@/components/plugin/PluginOverview.vue';
import { mdiInformationVariantCircleOutline } from '@mdi/js';

const { t } = useI18n();
const api = useApiStore();

const pluginsLoader = useAxiosPageLoader(async () => {
  return await api.Plugin.getAll();
});
const { items: plugins, reload: loadPlugins } = pluginsLoader;
const parsers = computed(() => {
  return plugins.value
    .map((plugin) => {
      return plugin.parsers.map((parser) => ({ ...parser, plugin }));
    })
    .flat();
});
</script>

<style scoped lang="sass"></style>
