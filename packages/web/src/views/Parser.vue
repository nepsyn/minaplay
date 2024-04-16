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
            link
            draggable="false"
          >
          </v-list-item>
        </multi-items-loader>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <authed-router-view match="^/parser/[^/]+$" />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useApiStore } from '@/store/api';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { computed } from 'vue';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';

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
