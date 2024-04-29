<template>
  <v-layout class="page-height">
    <v-navigation-drawer class="d-none d-md-flex" mobile-breakpoint="md" location="right">
      <v-list slim :lines="false" density="compact" nav>
        <v-list-subheader class="font-weight-bold">
          {{ t('parser.available') }}
        </v-list-subheader>
        <multi-items-loader lazy class="pa-0" :loader="pluginsLoader" hide-load-more hide-empty>
          <template v-if="parsers.length > 0">
            <v-list-item
              v-for="(parser, index) in parsers"
              :key="index"
              :prepend-avatar="parser.plugin.icon || BlankFavicon"
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
          </template>
          <template v-else>
            <div class="mt-4 d-flex flex-column align-center">
              <v-icon size="64" :icon="mdiEmoticonSadOutline"></v-icon>
              <span class="mt-3 text-caption text-medium-emphasis">
                {{ t('app.loader.empty') }}
              </span>
            </div>
          </template>
        </multi-items-loader>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <to-top-container class="page-height overflow-auto text-wrap text-break">
        <v-container class="d-flex flex-column pa-md-8" v-if="route.name === 'parser'">
          <span class="text-h4">{{ t('parser.title') }}</span>
          <v-row class="mt-3" dense>
            <v-col cols="12" sm="auto" class="flex-grow-1">
              <v-text-field
                variant="outlined"
                density="compact"
                color="primary"
                :prepend-inner-icon="mdiMagnify"
                hide-details
                :label="t('app.input.keyword')"
                :placeholder="t('app.input.placeholder', { item: t('parser.title') })"
                clearable
                v-model.trim="keyword"
              ></v-text-field>
            </v-col>
            <v-col sm="auto">
              <v-btn
                variant="flat"
                block
                height="40"
                color="info"
                :prepend-icon="mdiRefresh"
                :loading="loading"
                @click="request()"
              >
                {{ t('app.actions.refresh') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-divider class="my-2"></v-divider>
          <multi-items-loader class="pa-0" :loader="pluginsLoader" hide-load-more hide-empty>
            <template v-if="filteredParsers.length > 0">
              <v-list class="py-3">
                <template v-for="(parser, index) in filteredParsers" :key="index">
                  <v-list-item
                    lines="two"
                    :prepend-avatar="parser.plugin.icon || BlankFavicon"
                    :append-icon="mdiChevronRight"
                    :title="parser.name"
                    color="primary"
                    :to="`/parser/${parser.plugin.id}/${parser.name}`"
                    draggable="false"
                  >
                  </v-list-item>
                  <v-divider v-if="index < parsers.length - 1"></v-divider>
                </template>
              </v-list>
            </template>
            <template v-else>
              <v-container class="d-flex flex-column justify-center align-center text-body-2">
                <span class="text-medium-emphasis">
                  {{ t('app.loader.empty') }}
                </span>
              </v-container>
            </template>
          </multi-items-loader>
        </v-container>
        <multi-items-loader
          class="pa-md-8"
          :loader="pluginsLoader"
          hide-load-more
          hide-empty
          hide-loading
          hide-load
          hide-error
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
import { computed, provide, ref } from 'vue';
import PluginOverview from '@/components/plugin/PluginOverview.vue';
import {
  mdiChevronRight,
  mdiEmoticonSadOutline,
  mdiInformationVariantCircleOutline,
  mdiMagnify,
  mdiRefresh,
} from '@mdi/js';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';
import { useRoute, useRouter } from 'vue-router';
import BlankFavicon from '@/assets/blank-favicon.png';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();

const pluginsLoader = useAxiosPageLoader(async () => {
  return await api.Plugin.getAll();
});
const { items: plugins, pending: loading, reload: request, onResolved: onPluginLoaded } = pluginsLoader;
onPluginLoaded(() => {
  if (parsers.value.length === 1) {
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

const keyword = ref('');
const filteredParsers = computed(() => {
  if (keyword.value?.length > 0) {
    return parsers.value.filter(({ name }) => name.toLowerCase().includes(keyword.value.toLowerCase()));
  }
  return parsers.value;
});
</script>

<style scoped lang="sass"></style>
