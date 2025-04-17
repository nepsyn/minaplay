<template>
  <div class="mb-6">
    <div class="d-flex flex-row align-center">
      <v-icon :icon="mdiMotionPlayOutline" size="x-large"></v-icon>
      <span class="text-h5 ml-3">{{ t('resource.seriesUpdates') }}</span>
      <v-spacer></v-spacer>
      <v-btn
        class="ml-1"
        variant="text"
        :icon="mdiRefresh"
        :loading="updatesLoader.pending.value"
        @click="updatesLoader.reload()"
      ></v-btn>
    </div>
    <multi-items-loader :loader="updatesLoader" class="px-0 py-4" :hide-empty="updates.length > 0">
      <v-row :dense="display.mdAndDown.value">
        <v-col v-for="episode in updates" :key="episode.id" cols="4" sm="3" md="2">
          <series-overview
            :series="episode.series"
            :label="episode.pubAt && new Date(episode.pubAt).toLocaleDateString(locale)"
            :note="getEpisodeNote(episode)"
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
import { mdiMotionPlayOutline, mdiRefresh } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { EpisodeEntity } from '@/api/interfaces/series.interface';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

const { t, locale } = useI18n();
const api = useApiStore();
const router = useRouter();
const display = useDisplay();

const getEpisodeNote = (episode: EpisodeEntity) => {
  if ((episode.series.count && Number(episode.no) >= episode.series.count) || episode.series.finished) {
    return `${episode.no} ${t('resource.fin')}`;
  } else {
    return episode.no;
  }
};

const updatesLoader = useAxiosPageLoader(
  async (query: ApiQueryDto<EpisodeEntity> = {}) => {
    return await api.Episode.queryUpdate({
      ...query,
    });
  },
  { page: 0, size: 18 },
);
const { items: updates } = updatesLoader;
</script>

<style scoped lang="sass"></style>
