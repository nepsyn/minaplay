<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <single-item-loader class="pa-0 my-3" :loader="seriesLoader">
        <template #loading>
          <v-row>
            <v-col cols="9">
              <v-skeleton-loader type="article,article"></v-skeleton-loader>
            </v-col>
            <v-col cols="3">
              <v-skeleton-loader type="image,image"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
        <v-sheet v-if="series" border class="pa-6 rounded">
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
              <v-divider class="my-2"></v-divider>
              <v-row class="flex-grow-0">
                <v-col cols="4" class="d-block d-sm-none">
                  <zoom-img
                    class="rounded-lg"
                    :aspect-ratio="1 / 1.4"
                    :src="series.poster ? api.File.buildRawPath(series.poster) : SeriesPosterFallback"
                    :placeholder="SeriesPosterFallback"
                  ></zoom-img>
                </v-col>
                <v-col cols="8" sm="12" class="d-flex flex-column flex-grow-0">
                  <expandable-text
                    class="text-subtitle-1"
                    :content="series.description ?? t('resource.noDescription')"
                  ></expandable-text>
                </v-col>
              </v-row>
              <v-divider class="my-2"></v-divider>
              <v-list slim :lines="false" class="pa-0">
                <v-list-item class="px-0 text-subtitle-2" density="compact">
                  <template #prepend>
                    <span class="font-weight-bold">{{ t('episode.info.count') }}</span>
                  </template>
                  <span class="ml-2">{{ series.count ?? t('app.unknown') }}</span>
                </v-list-item>
                <v-list-item class="px-0 text-subtitle-2" density="compact">
                  <template #prepend>
                    <span class="font-weight-bold">{{ t('episode.info.pubAt') }}</span>
                  </template>
                  <span class="ml-2">
                    {{ Date.parse(series.pubAt!) ? new Date(series.pubAt!).toLocaleString(locale) : t('app.unknown') }}
                  </span>
                </v-list-item>
                <v-list-item class="px-0 text-subtitle-2" density="compact">
                  <template #prepend>
                    <span class="font-weight-bold">{{ t('episode.info.finished') }}</span>
                  </template>
                  <span class="ml-2">
                    {{ series.finished != undefined ? t(series.finished ? 'app.yes' : 'app.no') : t('app.unknown') }}
                  </span>
                </v-list-item>
                <v-list-item class="px-0 text-subtitle-2" density="compact">
                  <template #prepend>
                    <span class="font-weight-bold">{{ t('episode.info.tags') }}</span>
                  </template>
                  <expandable-text
                    v-if="series.tags && series.tags.length > 0"
                    :content="(series.tags ?? []).map(({ name }) => name).join('  ')"
                    class="ml-2"
                  ></expandable-text>
                  <span v-else class="ml-2">{{ t('app.none') }}</span>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col class="d-none d-sm-block" cols="3">
              <zoom-img
                class="rounded-lg"
                :aspect-ratio="1 / 1.4"
                :src="series.poster ? api.File.buildRawPath(series.poster) : SeriesPosterFallback"
                :placeholder="SeriesPosterFallback"
              ></zoom-img>
            </v-col>
          </v-row>
          <v-divider class="my-3"></v-divider>
          <v-row dense class="d-flex justify-start">
            <v-col cols="auto">
              <v-btn
                class="rounded-pill"
                variant="flat"
                :prepend-icon="mdiPlay"
                color="info"
                :disabled="episodes.length === 0"
                @click="router.push({ path: `/episode/${episodes[0].id}` })"
              >
                {{ t('resource.actions.watch') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-menu location="top center" offset="10">
                <v-card>
                  <v-card-text>
                    <v-list-subheader class="font-weight-bold">
                      {{ t('resource.actions.play') }}
                    </v-list-subheader>
                    <v-btn
                      variant="tonal"
                      color="primary"
                      :prepend-icon="mdiVideoVintage"
                      @click="liveSelectDialog = true"
                    >
                      {{ t('app.actions.select') }} {{ t('app.entities.live') }}
                    </v-btn>
                    <v-list-subheader class="font-weight-bold">
                      {{ t('app.or') }}
                    </v-list-subheader>
                    <v-btn variant="tonal" color="success" :prepend-icon="mdiPlus" @click="createLive()">
                      {{ t('app.actions.add') }} {{ t('app.entities.live') }}
                    </v-btn>
                  </v-card-text>
                </v-card>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    class="rounded-pill"
                    variant="flat"
                    :prepend-icon="mdiMotionPlayOutline"
                    color="secondary"
                    :disabled="episodes.length === 0"
                  >
                    {{ t('resource.actions.play') }}
                  </v-btn>
                </template>
              </v-menu>
              <live-selector
                owner
                v-model="liveSelectDialog"
                @selected="(live: LiveEntity) => router.push({ path: `/live/${live.id}`, query: { ep: episodes[0].id } })"
              ></live-selector>
            </v-col>
          </v-row>
        </v-sheet>
        <v-sheet border class="pa-6 my-4 rounded">
          <div class="d-flex align-center">
            <v-icon :icon="mdiViewComfy" size="large"></v-icon>
            <span class="text-h6 ml-3">{{ t('resource.episodes') }}</span>
          </div>
          <multi-items-loader class="px-0 py-3" :loader="episodesLoader" :hide-empty="episodes.length > 0">
            <v-row dense>
              <v-col cols="auto" v-for="episode in episodes" :key="episode.id">
                <v-btn variant="outlined" @click="router.push({ path: `/episode/${episode.id}` })">
                  {{ episode.no }}
                </v-btn>
              </v-col>
            </v-row>
          </multi-items-loader>
        </v-sheet>
      </single-item-loader>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useRoute, useRouter } from 'vue-router';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import ZoomImg from '@/components/app/ZoomImg.vue';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import ExpandableText from '@/components/app/ExpandableText.vue';
import { mdiMotionPlayOutline, mdiPlay, mdiPlus, mdiVideoVintage, mdiViewComfy } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { ref } from 'vue';
import { useToastStore } from '@/store/toast';
import { LiveEntity } from '@/api/interfaces/live.interface';
import LiveSelector from '@/components/live/LiveSelector.vue';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();
const route = useRoute();
const router = useRouter();

const seriesLoader = useAxiosRequest(async () => {
  return await api.Series.getById(Number(route.params.seriesId))();
});
const { data: series } = seriesLoader;

const episodesLoader = useAxiosPageLoader(
  async (query = {}) => {
    return await api.Episode.query({
      ...query,
      seriesId: series.value?.id,
      sort: 'pubAt',
      order: 'ASC',
    });
  },
  { page: 0, size: 24 },
);
const { items: episodes } = episodesLoader;

const liveSelectDialog = ref(false);
const {
  request: createLive,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Live.create({
    title: t('live.unnamed'),
  });
});
onCreated(async (data) => {
  await router.push({ path: `/live/${data.id}`, query: { ep: episodes.value[0].id } });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
