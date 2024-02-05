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
            <v-col cols="9" class="d-flex flex-column">
              <span class="text-h5 text-break">{{ series.name }}</span>
              <span v-if="series.season" class="text-body-2 text-medium-emphasis text-break">
                {{ t('series.seasonLabel', { season: series.season }) }}
              </span>
              <v-row class="mt-1 flex-grow-0" dense>
                <v-col cols="auto" v-for="(tag, index) in series.tags" :key="index">
                  <v-chip color="primary" density="comfortable" label :text="tag.name"></v-chip>
                </v-col>
              </v-row>
              <v-divider class="my-2"></v-divider>
              <expandable-text
                class="text-subtitle-1"
                :content="series.description ?? t('resource.noDescription')"
                style="min-height: 100px"
              ></expandable-text>
            </v-col>
            <v-col cols="3">
              <zoom-img
                class="rounded-lg"
                :aspect-ratio="1 / 1.4"
                :src="
                  series.poster ? api.File.buildRawPath(series.poster.id, series.poster.name) : SeriesPosterFallback
                "
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
              <v-btn
                class="rounded-pill"
                variant="flat"
                :prepend-icon="mdiMotionPlayOutline"
                color="secondary"
                :disabled="episodes.length === 0"
              >
                {{ t('resource.actions.play') }}
              </v-btn>
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
import { computed } from 'vue';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import ZoomImg from '@/components/app/ZoomImg.vue';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import ExpandableText from '@/components/app/ExpandableText.vue';
import { mdiMotionPlayOutline, mdiPlay, mdiViewComfy } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();

const seriesLoader = useAxiosRequest(async () => {
  return await api.Series.getById(Number(route.params.seriesId))();
});
const series = computed(() => seriesLoader.data.value);

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
</script>

<style scoped lang="sass"></style>
