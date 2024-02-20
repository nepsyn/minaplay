<template>
  <div class="mb-6">
    <div class="d-flex flex-row align-center">
      <v-icon :icon="mdiMultimedia" size="x-large"></v-icon>
      <span class="text-h5 ml-3">{{ t('resource.mediaUpdates') }}</span>
      <v-spacer></v-spacer>
      <v-tooltip location="left">
        {{ t(`app.input.${filters.order!.toLowerCase()}`) }}
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            :disabled="mediasLoader.pending.value"
            :icon="filters.order === 'ASC' ? mdiSortClockDescendingOutline : mdiSortClockAscendingOutline"
            @click="
              filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
              mediasLoader.reload();
            "
          ></v-btn>
        </template>
      </v-tooltip>
      <v-btn
        class="ml-1"
        variant="text"
        :icon="mdiRefresh"
        :loading="mediasLoader.pending.value"
        @click="mediasLoader.reload()"
      ></v-btn>
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
  </div>
</template>

<script setup lang="ts">
import { mdiMultimedia, mdiRefresh, mdiSortClockAscendingOutline, mdiSortClockDescendingOutline } from '@mdi/js';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { ref } from 'vue';
import { MediaQueryDto } from '@/api/interfaces/media.interface';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();
const display = useDisplay();

const filters = ref<MediaQueryDto>({
  sort: 'createAt',
  order: 'DESC',
});
const mediasLoader = useAxiosPageLoader(
  async (query: MediaQueryDto = {}) => {
    return await api.Media.query({
      ...query,
      ...filters.value,
    });
  },
  { page: 0, size: 12 },
);
const { items: medias } = mediasLoader;
</script>

<style scoped lang="sass"></style>
