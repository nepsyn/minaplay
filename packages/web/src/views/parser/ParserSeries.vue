<template>
  <div class="d-flex flex-row align-center">
    <v-btn :icon="mdiChevronLeft" variant="text" density="compact" size="x-large" @click="backToHome()"></v-btn>
    <v-toolbar-title class="ml-3 cursor-pointer" @click="backToHome()">
      {{ t('parser.backToHome') }}
    </v-toolbar-title>
  </div>
  <v-divider class="my-3"></v-divider>
  <single-item-loader class="pa-0" :loader="seriesLoader">
    <v-sheet v-if="series" class="pa-4">
      <v-row>
        <v-col cols="12" sm="9" class="d-flex flex-column">
          <div class="d-flex flex-row align-center justify-space-between">
            <div>
              <span class="text-h5 text-break">{{ series.name }}</span>
              <span v-if="series.season" class="text-body-2 text-medium-emphasis text-break ml-2">
                {{ +series.season ? t('series.seasonLabel', { season: series.season }) : series.season }}
              </span>
            </div>
          </div>
          <v-row class="mt-2">
            <v-col cols="4" class="d-block d-sm-none">
              <zoom-img
                class="rounded-lg"
                :aspect-ratio="1 / 1.4"
                :src="series.posterUrl"
                :placeholder="SeriesPosterFallback"
              ></zoom-img>
            </v-col>
            <v-col cols="8" sm="12">
              <expandable-text
                class="text-subtitle-1"
                :content="series.description ?? t('resource.noDescription')"
                style="min-height: 100px"
              ></expandable-text>
            </v-col>
          </v-row>
        </v-col>
        <v-col class="d-none d-sm-block" cols="3">
          <zoom-img
            class="rounded-lg"
            :aspect-ratio="1 / 1.4"
            :src="series.posterUrl"
            :placeholder="SeriesPosterFallback"
          ></zoom-img>
        </v-col>
      </v-row>
      <v-divider class="my-3"></v-divider>
      <v-row dense class="d-flex justify-start"> </v-row>
    </v-sheet>
  </single-item-loader>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject } from 'vue';
import { MinaPlayParserMetadata, PluginControl } from '@/api/interfaces/plugin.interface';
import { useRoute, useRouter } from 'vue-router';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { mdiChevronLeft } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import ExpandableText from '@/components/app/ExpandableText.vue';
import ZoomImg from '@/components/app/ZoomImg.vue';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();

const backToHome = async () => {
  await router.replace({ path: `/parser/${parser.value!.plugin.id}/${parser.value!.name}` });
};

const parsers = inject<ComputedRef<(MinaPlayParserMetadata & { plugin: PluginControl })[]>>('parsers');
const parser = computed(() => {
  return (parsers?.value ?? []).find(
    ({ name, plugin }) => name === route.params.parserId && plugin.id === route.params.pluginId,
  );
});

const seriesLoader = useAxiosRequest(async () => {
  return api.Plugin.getParserSeries(parser.value!.plugin.id, parser.value!.name, route.params.seriesId as string)();
});
const { data: series, onResolved: onSeriesLoaded, onRejected: onSeriesLoadFailed } = seriesLoader;
onSeriesLoaded(async (data) => {
  if (!data.name || !data.id) {
    await router.replace({ path: '/404' });
  }
});
onSeriesLoadFailed(async () => {
  await router.replace({ path: '/404' });
});
</script>

<style scoped lang="sass"></style>
