<template>
  <div>
    <div class="d-flex flex-row align-center">
      <v-icon :icon="mdiAnimationPlayOutline" size="x-large"></v-icon>
      <span class="text-h5 ml-3">{{ t('resource.seriesUpdates') }}</span>
    </div>
    <multi-items-loader
      :loader="updatesLoader"
      class="px-0 py-4"
      :hide-empty="updates.length > 0"
      hide-load-more
      :auto="updates.length < 18"
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
  </div>
</template>

<script setup lang="ts">
import { mdiAnimationPlayOutline } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { EpisodeQueryDto } from '@/api/interfaces/series.interface';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
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
  { page: 0, size: 18 },
);
const updates = computed(() =>
  updatesLoader.items.value.filter(
    (episode, index) =>
      episode.series && updatesLoader.items.value.findIndex(({ series }) => series?.id === episode.series.id) === index,
  ),
);
</script>

<style scoped lang="sass"></style>
