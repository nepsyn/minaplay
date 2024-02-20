<template>
  <div class="mb-6">
    <div class="d-flex flex-row align-center">
      <v-icon :icon="mdiAnimationPlayOutline" size="x-large"></v-icon>
      <span class="text-h5 ml-3">{{ t('resource.allSeries') }}</span>
      <v-spacer></v-spacer>
      <v-tooltip location="left">
        {{ t(`app.input.${filters.order!.toLowerCase()}`) }}
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            :disabled="seriesLoader.pending.value"
            :icon="filters.order === 'ASC' ? mdiSortClockDescendingOutline : mdiSortClockAscendingOutline"
            @click="
              filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
              seriesLoader.reload();
            "
          ></v-btn>
        </template>
      </v-tooltip>
      <v-btn
        class="ml-1"
        variant="text"
        :icon="mdiRefresh"
        :loading="seriesLoader.pending.value"
        @click="seriesLoader.reload()"
      ></v-btn>
    </div>
    <multi-items-loader :loader="seriesLoader" class="px-0 py-4" :hide-empty="series.length > 0">
      <v-row :dense="display.mdAndDown.value">
        <v-col v-for="item in series" :key="item.id" cols="4" sm="3" md="2">
          <series-overview :series="item" @click="router.push({ path: `/series/${item.id}` })"></series-overview>
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
import {
  mdiAnimationPlayOutline,
  mdiRefresh,
  mdiSortClockAscendingOutline,
  mdiSortClockDescendingOutline,
} from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { SeriesQueryDto } from '@/api/interfaces/series.interface';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { ref } from 'vue';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();
const display = useDisplay();

const filters = ref<SeriesQueryDto>({
  sort: 'createAt',
  order: 'DESC',
});
const seriesLoader = useAxiosPageLoader(
  async (query: SeriesQueryDto = {}) => {
    return await api.Series.query({
      ...query,
      ...filters.value,
    });
  },
  { page: 0, size: 12 },
);
const { items: series } = seriesLoader;
</script>

<style scoped lang="sass"></style>
