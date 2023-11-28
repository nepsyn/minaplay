<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiUpdate" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.updates') }}</span>
      </div>
      <multi-items-loader :loader="updatesLoader" class="px-0 py-2" hide-load-more>
        <v-row no-gutters>
          <v-col v-for="episode in updates" :key="episode.id" cols="4" sm="3" md="2">
            {{ episode }}
          </v-col>
        </v-row>
        <template #loading>
          <v-row>
            <v-col v-for="index in 12" :key="index" cols="4" sm="3" md="2">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiMotionPlayOutline" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.continue') }}</span>
      </div>
      <multi-items-loader :loader="historyLoader" class="px-0 py-2" hide-load-more>
        <v-row no-gutters>
          <v-col v-for="item in history" :key="item.id" cols="6" sm="4" md="3">
            {{ item }}
          </v-col>
        </v-row>
        <template #loading>
          <v-row>
            <v-col v-for="index in 12" :key="index" cols="6" sm="4" md="3">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiPlaylistPlay" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.subscribe') }}</span>
      </div>
      <multi-items-loader :loader="subscribesLoader" class="px-0 py-2" hide-load-more>
        <v-row no-gutters>
          <v-col v-for="(subscribe, index) in subscribes" :key="index" cols="4" sm="3" md="2">
            {{ subscribe }}
          </v-col>
        </v-row>
        <template #loading>
          <v-row>
            <v-col v-for="index in 12" :key="index" cols="4" sm="3" md="2">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiAnimationPlayOutline" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.series') }}</span>
      </div>
      <multi-items-loader :loader="seriesLoader" class="px-0 py-2" hide-load-more>
        <v-row no-gutters>
          <v-col v-for="item in series" :key="item.id" cols="4" sm="3" md="2">
            {{ item }}
          </v-col>
        </v-row>
        <template #loading>
          <v-row>
            <v-col v-for="index in 12" :key="index" cols="4" sm="3" md="2">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </multi-items-loader>
      <div class="d-flex flex-row align-center">
        <v-icon :icon="mdiMultimedia" size="x-large"></v-icon>
        <span class="text-h5 ml-3">{{ t('resource.medias') }}</span>
      </div>
      <multi-items-loader :loader="mediasLoader" class="px-0 py-2" hide-load-more>
        <v-row no-gutters>
          <v-col v-for="media in medias" :key="media.id" cols="6" sm="4" md="3">
            {{ media }}
          </v-col>
        </v-row>
        <template #loading>
          <v-row>
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
import { mdiAnimationPlayOutline, mdiMotionPlayOutline, mdiMultimedia, mdiPlaylistPlay, mdiUpdate } from '@mdi/js';
import { EpisodeQueryDto } from '@/api/interfaces/series.interface';

const { t } = useI18n();
const api = useApiStore();

const updatesLoader = useAxiosPageLoader(
  async (query?: EpisodeQueryDto) => {
    return await api.Episode.query({
      ...(query ?? {}),
      sort: 'pubAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 12 },
);
const updates = computed(() => updatesLoader.items.value);

const historyLoader = useAxiosPageLoader(api.ViewHistory.getAll, { page: 0, size: 12 });
const history = computed(() => historyLoader.items.value);

const subscribesLoader = useAxiosPageLoader(api.SeriesSubscribe.getAll, { page: 0, size: 12 });
const subscribes = computed(() => subscribesLoader.items.value);

const seriesLoader = useAxiosPageLoader(api.Series.query, { page: 0, size: 12 });
const series = computed(() => seriesLoader.items.value);

const mediasLoader = useAxiosPageLoader(api.Media.query, { page: 0, size: 12 });
const medias = computed(() => mediasLoader.items.value);
</script>
