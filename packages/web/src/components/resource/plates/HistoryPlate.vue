<template>
  <div>
    <div class="d-flex flex-row align-center mt-6">
      <v-icon :icon="mdiHistory" size="x-large"></v-icon>
      <span class="text-h5 ml-3">{{ t('resource.histories') }}</span>
    </div>
    <multi-items-loader :loader="historiesLoader" class="px-0 py-4" :hide-empty="histories.length > 0">
      <v-row :dense="display.mdAndDown.value">
        <v-col v-for="history in histories" :key="history.id" cols="12" sm="6">
          <media-overview-landscape
            show-chips
            :media="history.media"
            @click="
              router.push({ path: history.episode ? `/episode/${history.episode.id}` : `/media/${history.media.id}` })
            "
            :history-duration="history.progress"
          >
            <template #append>
              <div class="ml-2 px-1 text-caption">
                <time-ago :time="history.updateAt" :label="t('resource.watched')"></time-ago>
              </div>
            </template>
          </media-overview-landscape>
        </v-col>
      </v-row>
      <template #loading>
        <v-row :dense="display.mdAndDown.value">
          <v-col v-for="index in 8" :key="index" cols="12" sm="6">
            <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
          </v-col>
        </v-row>
      </template>
    </multi-items-loader>
  </div>
</template>

<script setup lang="ts">
import { mdiHistory } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import TimeAgo from '@/components/app/TimeAgo.vue';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();
const display = useDisplay();

const historiesLoader = useAxiosPageLoader(
  async (query = {}) => {
    return await api.ViewHistory.query({
      ...query,
      sort: 'updateAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 8 },
);
const { items: histories } = historiesLoader;
</script>

<style scoped lang="sass"></style>
