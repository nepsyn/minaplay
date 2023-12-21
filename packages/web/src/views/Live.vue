<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <span class="text-h4">{{ t('live.title') }}</span>
      <v-row class="py-2" dense>
        <v-col cols="12" sm="auto" class="flex-grow-1">
          <v-text-field
            variant="outlined"
            density="compact"
            color="primary"
            hide-details
            :label="t('app.input.keyword')"
            :placeholder="t('app.input.placeholder', { item: t('app.entities.live') })"
            clearable
            v-model="filters.keyword"
            @update:model-value="useQuery"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-select
            variant="outlined"
            :label="t('app.input.order')"
            density="compact"
            v-model="filters.order"
            :items="[t('app.input.desc'), t('app.input.asc')]"
            hide-details
            clearable
            @update:model-value="query"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="auto" class="flex-grow-0">
          <v-btn
            height="40"
            color="success"
            variant="flat"
            :prepend-icon="mdiPlus"
            block
            :loading="creating"
            @click="createLive()"
          >
            {{ t('app.actions.add') }}
          </v-btn>
        </v-col>
      </v-row>
      <v-divider class="my-2"></v-divider>
      <multi-items-loader :loader="livesLoader" class="px-0 py-2 mt-2" auto>
        <v-row>
          <v-col v-for="live in lives" :key="live.id" cols="6" sm="4" md="3">
            <live-overview :live="live" @click="router.push({ path: `/live/${live.id}` })"></live-overview>
          </v-col>
        </v-row>
      </multi-items-loader>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { computed, ref } from 'vue';
import { useApiStore } from '@/store/api';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LiveQueryDto } from '@/api/interfaces/live.interface';
import { debounce } from '@/utils/utils';
import { useToastStore } from '@/store/toast';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { mdiPlus } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import LiveOverview from '@/components/live/LiveOverview.vue';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();
const toast = useToastStore();

const livesLoader = useAxiosPageLoader(
  async (query: LiveQueryDto = {}) => {
    return await api.Live.query({
      ...query,
      order: filters.value.order,
      keyword: filters.value.keyword,
    });
  },
  { page: 0, size: 120 },
);
const lives = computed(() => livesLoader.items.value);

const filters = ref<Partial<LiveQueryDto>>({
  keyword: '',
  order: 'DESC',
});
const query = () => {
  livesLoader.reset();
  livesLoader.request();
};
const useQuery = debounce(query, 1000);

const {
  pending: creating,
  request: createLive,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Live.create({
    title: t('live.unnamed'),
  });
});
onCreated(async (data) => {
  await router.push({ path: `/live/${data.id}` });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
