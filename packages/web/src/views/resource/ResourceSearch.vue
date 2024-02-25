<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <span class="text-h4">{{ t('layout.actions.search') }}</span>
      <v-text-field
        class="mt-3"
        autofocus
        variant="outlined"
        :label="t('app.input.keyword')"
        color="primary"
        density="compact"
        hide-details
        :prepend-inner-icon="mdiMagnify"
        clearable
        v-model.trim="filters.keyword"
        @update:model-value="useQuery()"
      ></v-text-field>
      <v-chip-group v-model="types" multiple @update:model-value="reload">
        <v-chip v-for="resource in resources" :key="resource.value" :value="resource.value" filter color="primary">
          {{ resource.title }}
        </v-chip>
      </v-chip-group>
      <v-divider class="my-2"></v-divider>
      <template v-for="resource in selectedResources" :key="resource.value">
        <div class="mb-6" v-if="resource.loader.items.value.length > 0">
          <div class="d-flex flex-row align-center">
            <span class="text-h6">{{ resource.title }}</span>
          </div>
          <multi-items-loader :loader="resource.loader" hide-load hide-empty lazy class="px-0 py-4">
            <v-row dense>
              <template v-if="resource.value === 'series'">
                <v-col v-for="item in resource.loader.items.value" :key="item.id" cols="4" sm="3" md="2">
                  <series-overview
                    :series="item as SeriesEntity"
                    @click="router.push({ path: `/series/${item.id}` })"
                  ></series-overview>
                </v-col>
              </template>
              <template v-if="resource.value === 'media'">
                <v-col v-for="item in resource.loader.items.value" :key="item.id" cols="6" sm="4" md="3">
                  <media-overview
                    :media="item as MediaEntity"
                    @click="router.push({ path: `/media/${item.id}` })"
                  ></media-overview>
                </v-col>
              </template>
            </v-row>
          </multi-items-loader>
        </div>
      </template>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { mdiMagnify } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useApiStore } from '@/store/api';
import { SeriesEntity, SeriesQueryDto } from '@/api/interfaces/series.interface';
import { MediaEntity, MediaQueryDto } from '@/api/interfaces/media.interface';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import { debounce } from '@/utils/utils';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const api = useApiStore();

const filters = ref({
  keyword: '',
});
const reload = () => {
  for (const resource of selectedResources.value) {
    resource.loader.reload();
  }
};
const useQuery = debounce(reload, 1000);

const types = ref(['series', 'media']);
const selectedResources = computed(() => {
  return resources.filter(({ value }) => types.value.includes(value));
});
const resources = [
  {
    title: t('app.entities.series'),
    value: 'series',
    loader: useAxiosPageLoader(
      async (query: SeriesQueryDto = {}) => {
        return await api.Series.query({
          ...query,
          keyword: filters.value.keyword,
        });
      },
      { page: 0, size: 24 },
    ),
  },
  {
    title: t('app.entities.media'),
    value: 'media',
    loader: useAxiosPageLoader(
      async (query: MediaQueryDto = {}) => {
        return await api.Media.query({
          ...query,
          keyword: filters.value.keyword,
        });
      },
      { page: 0, size: 24 },
    ),
  },
];
</script>

<style scoped lang="sass"></style>
