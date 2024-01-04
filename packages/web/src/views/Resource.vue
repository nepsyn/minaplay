<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiUpdate" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.updates') }}</span>
      </div>
      <multi-items-loader
        :loader="updatesLoader"
        class="px-0 py-4"
        hide-load-more
        :hide-empty="updates.length > 0"
        :auto="updates.length < 12"
      >
        <v-row :dense="display.mdAndDown.value">
          <v-col v-for="episode in updates" :key="episode.id" cols="4" sm="3" md="2">
            <series-overview
              :series="episode.series"
              :label="episode.pubAt && new Date(episode.pubAt).toLocaleDateString(locale)"
              :note="episode.no"
              @click="router.push({ path: `/episode/${episode.id}` })"
            ></series-overview>
          </v-col>
        </v-row>
        <template #loading>
          <v-row :dense="display.mdAndDown.value">
            <v-col v-for="index in 12" :key="index" cols="4" sm="3" md="2">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
      <div class="d-flex flex-row align-center mt-6">
        <v-icon :icon="mdiMultimedia" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.medias') }}</span>
      </div>
      <multi-items-loader :loader="mediasLoader" class="px-0 py-4" :hide-empty="medias.length > 0">
        <v-row :dense="display.mdAndDown.value">
          <v-col v-for="media in medias" :key="media.id" cols="6" sm="4" md="3">
            <media-overview :media="media" @click="router.push({ path: `/media/${media.id}` })"></media-overview>
          </v-col>
        </v-row>
        <template #loading>
          <v-row :dense="display.mdAndDown.value">
            <v-col v-for="index in 12" :key="index" cols="6" sm="4" md="3">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
    </v-container>
  </to-top-container>
</template>

<script lang="ts" setup>
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { computed } from 'vue';
import { mdiMultimedia, mdiUpdate } from '@mdi/js';
import { EpisodeQueryDto } from '@/api/interfaces/series.interface';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

const { t, locale } = useI18n();
const api = useApiStore();
const router = useRouter();
const display = useDisplay();

const updatesLoader = useAxiosPageLoader(
  async (query: EpisodeQueryDto = {}) => {
    return await api.Episode.query({
      ...query,
      sort: 'pubAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 12 },
);
const updates = computed(() =>
  updatesLoader.items.value.filter(
    (episode, index) =>
      episode.series && updatesLoader.items.value.findIndex(({ series }) => series?.id === episode.series.id) === index,
  ),
);

const mediasLoader = useAxiosPageLoader(
  async (query = {}) => {
    return await api.Media.query({
      ...query,
      sort: 'createAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 12 },
);
const medias = computed(() => mediasLoader.items.value);
</script>
