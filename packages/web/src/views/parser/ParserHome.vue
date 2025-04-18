<template>
  <div class="d-flex flex-column" :key="parserKey">
    <div class="mb-8" v-if="parser?.features.searchSeries">
      <v-row dense class="pa-0 mb-3">
        <v-col cols="auto" class="d-flex flex-row align-center">
          <v-icon :icon="mdiMagnify" size="x-large"></v-icon>
          <span class="text-h5 ms-3">{{ t('parser.search') }}</span>
        </v-col>
      </v-row>

      <v-text-field
        variant="outlined"
        density="compact"
        color="primary"
        :prepend-inner-icon="mdiMagnify"
        hide-details
        :label="t('app.input.keyword')"
        :placeholder="t('app.input.placeholder', { item: t('app.entities.series') })"
        clearable
        v-model.trim="keyword"
        @update:model-value="useSeriesQuery()"
      ></v-text-field>

      <multi-items-loader
        v-if="seriesLoading || seriesLoaded"
        class="pa-0 mt-4"
        :loader="seriesLoader"
        :hide-empty="series.length > 0"
        lazy
      >
        <v-row :dense="display.mdAndDown.value">
          <v-col v-for="item in series" :key="item.id" cols="4" sm="3" md="2">
            <series-overview :series="item as any" @click="onSeriesClick(item)"></series-overview>
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

    <div class="mb-8" v-if="parser?.features.getCalendar">
      <v-row dense class="pa-0 mb-3">
        <v-col cols="auto" class="d-flex flex-row align-center">
          <v-icon :icon="mdiCalendarMonthOutline" size="x-large"></v-icon>
          <span class="text-h5 ms-3">{{ t('parser.calendar') }}</span>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn-toggle class="border overflow-x-auto" color="primary" density="compact" mandatory v-model="weekday">
            <v-btn size="small" v-for="i in 7" :value="i - 1">
              {{ t(`parser.weekdays.${i - 1}`) }}
              <template v-if="new Date().getDay() === i - 1"> ({{ t('parser.weekdays.today') }}) </template>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <single-item-loader class="pa-0" :loader="calendarLoader">
        <v-row :dense="display.mdAndDown.value">
          <v-col v-for="item in weekdayItems" :key="item.id" cols="4" sm="3" md="2">
            <series-overview :series="item as any" @click="onSeriesClick(item)"></series-overview>
          </v-col>
        </v-row>
        <template #loading>
          <v-row :dense="display.mdAndDown.value">
            <v-col v-for="index in 12" :key="index" cols="4" sm="3" md="2">
              <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
      </single-item-loader>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { FileSourceEnum } from '@/api/enums/file-source.enum';
import { useApiStore } from '@/store/api';
import { MinaPlayParserMetadata, MinaPlayPluginSourceSeries, PluginControl } from '@/api/interfaces/plugin.interface';
import { mdiCalendarMonthOutline, mdiMagnify } from '@mdi/js';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { debounce } from '@/utils/utils';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const parsers = inject<ComputedRef<(MinaPlayParserMetadata & { plugin: PluginControl })[]>>('parsers');
const parser = computed(() => {
  return (parsers?.value ?? []).find(
    ({ name, plugin }) => name === route.params.parserId && plugin.id === route.params.pluginId,
  );
});
const parserKey = computed(() => {
  return `${parser.value?.plugin.id ?? ''}-${parser.value?.name ?? ''}`;
});
watch(
  () => parser.value,
  async () => {
    if (!parser.value) {
      await router.replace({ path: '/parser' });
    }
  },
);

const keyword = ref('');
const seriesLoader = useAxiosPageLoader(
  async (query) => {
    if (!parser.value || !parser.value.features.searchSeries) {
      throw new Error('not implemented');
    }
    return await api.Plugin.queryParserSeries(
      parser.value.plugin.id,
      parser.value.name,
    )({
      keyword: keyword.value,
      ...query,
    });
  },
  { page: 0, size: 36 },
);
const { reload: querySeries, pending: seriesLoading, reset: resetSeries, loaded: seriesLoaded } = seriesLoader;
const useSeriesQuery = debounce(() => {
  if (keyword.value?.length > 0) {
    return querySeries();
  } else {
    resetSeries();
  }
}, 1000);
const series = computed(() => {
  return (seriesLoader.items.value ?? []).map((item) => ({
    ...item,
    poster: {
      source: FileSourceEnum.NETWORK,
      url: item.posterUrl,
    },
  }));
});

const weekday = ref(new Date().getDay());
const calendarLoader = useAxiosRequest(async () => {
  if (!parser.value || !parser.value.features.getCalendar) {
    throw new Error('not implemented');
  }
  return api.Plugin.getParserCalendar(parser.value.plugin.id, parser.value.name)();
});
const weekdayItems = computed(() => {
  const day = (calendarLoader.data.value ?? []).find(({ weekday: day }) => day === weekday.value);
  return (day?.items ?? []).map((item) => ({
    ...item,
    poster: {
      source: FileSourceEnum.NETWORK,
      url: item.posterUrl,
    },
  }));
});
const onSeriesClick = async (item: MinaPlayPluginSourceSeries) => {
  await router.push({ path: `/parser/${parser.value!.plugin.id}/${parser.value!.name}/${item.id}` });
};
</script>

<style scoped lang="sass"></style>
