<script setup lang="ts">
import MediaPlate from '@/components/resource/MediaPlate.vue';
import { mdiMultimedia, mdiPlaylistPlay, mdiRefresh } from '@mdi/js';
import { ref, Ref } from 'vue';
import { MediaQueryDto } from '@/interfaces/media.interface';
import { useRouter } from 'vue-router';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import SeriesPlate from '@/components/resource/SeriesPlate.vue';
import { SeriesQueryDto } from '@/interfaces/series.interface';

const router = useRouter();

const latestUpdateMediaQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 8,
  sort: 'createAt',
  order: 'DESC',
});

const seriesQuery: Ref<SeriesQueryDto> = ref({
  page: 0,
  size: 12,
  sort: 'createAt',
  order: 'DESC',
});
</script>

<template>
  <v-container fluid class="py-4 px-6">
    <series-plate
      class="py-0"
      title="剧集列表"
      :query="seriesQuery"
      :icon="mdiMultimedia"
      cols="6"
      sm="3"
      md="2"
      icon-color="secondary-lighten-1"
      @click:series="(item) => router.push(`/series/${item.id}`)"
    >
      <template #actions="{ load, reset, status }">
        <action-btn
          color="primary"
          text="刷新"
          :icon="mdiRefresh"
          @click="reset() & load?.()"
          :loading="status === 'loading'"
        ></action-btn>
      </template>
    </series-plate>
    <media-plate
      class="py-0"
      title="媒体列表"
      :query="latestUpdateMediaQuery"
      :icon="mdiPlaylistPlay"
      cols="12"
      sm="6"
      md="4"
      lg="3"
      icon-color="primary"
      @click:media="(media) => router.push(`/media/${media.id}`)"
    >
      <template #actions="{ load, reset, status }">
        <action-btn
          color="primary"
          text="刷新"
          :icon="mdiRefresh"
          @click="reset() & load?.()"
          :loading="status === 'loading'"
        ></action-btn>
      </template>
    </media-plate>
  </v-container>
</template>

<style scoped lang="sass"></style>
