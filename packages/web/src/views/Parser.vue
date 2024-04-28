<template>
  <v-layout class="page-height">
    <v-navigation-drawer class="d-none d-md-flex" mobile-breakpoint="md" location="right">
      <v-list slim :lines="false" density="compact" nav>
        <v-list-subheader class="font-weight-bold">
          {{ t('parser.available') }}
        </v-list-subheader>
        <multi-items-loader lazy class="pa-0" :loader="pluginsLoader" hide-load-more :hide-empty="plugins.length > 0">
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
    <v-main>
      <to-top-container class="page-height overflow-auto">
        <multi-items-loader
          wait-data
          class="pa-md-8 text-wrap text-break"
          :loader="pluginsLoader"
          hide-load-more
          :hide-empty="plugins.length > 0"
        >
          <authed-router-view match="^/parser/[^/]+$"></authed-router-view>
        </multi-items-loader>
      </to-top-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useApiStore } from '@/store/api';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { computed, provide } from 'vue';
import PluginOverview from '@/components/plugin/PluginOverview.vue';
import { mdiInformationVariantCircleOutline } from '@mdi/js';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();

const pluginsLoader = useAxiosPageLoader(async () => {
  return await api.Plugin.getAll();
});
const { items: plugins, onResolved: onPluginLoaded } = pluginsLoader;
onPluginLoaded(() => {
  if (parsers.value.length > 0) {
    const parser = parsers.value[0];
    router.push({ path: `/parser/${parser.plugin.id}/${parser.name}` });
  }
});
const parsers = computed(() => {
  return plugins.value
    .map((plugin) => {
      return plugin.parsers
        .filter((parser) => parser.features.searchSeries || parser.features.getCalendar)
        .map((parser) => ({ ...parser, plugin }));
    })
    .flat();
});
provide('parsers', parsers);
</script>

<style scoped lang="sass"></style>
