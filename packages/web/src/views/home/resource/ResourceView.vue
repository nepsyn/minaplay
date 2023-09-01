<script setup lang="ts">
import { mdiMultimedia, mdiPlaylistPlay, mdiRefresh } from '@mdi/js';
import { ref, Ref } from 'vue';
import { MediaQueryDto } from '@/interfaces/media.interface';
import { useRouter } from 'vue-router';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { SeriesQueryDto } from '@/interfaces/series.interface';
import ResourcePlate from '@/components/resource/ResourcePlate.vue';
import { Api } from '@/api/api';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const router = useRouter();

const latestUpdateMediaQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 12,
  sort: 'createAt',
  order: 'DESC',
});

const latestUpdateEpisodeQuery: Ref<SeriesQueryDto> = ref({
  page: 0,
  size: 12,
});
</script>

<template>
  <v-container fluid>
    <resource-plate
      class="py-0"
      title="剧集更新"
      :query="latestUpdateEpisodeQuery"
      :query-fn="Api.Episode.queryUpdate"
      :icon="mdiMultimedia"
      cols="4"
      sm="3"
      md="2"
      icon-color="secondary-lighten-1"
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
      <template #default="{ item: episode }">
        <series-overview
          class="pa-2"
          v-ripple
          @click:content="router.push(`/ep/${episode!.id}`)"
          @click.right.prevent
          :series="episode!.series"
          :label="`${new Date(episode!.createAt).toLocaleDateString()} 更新`"
        ></series-overview>
      </template>
    </resource-plate>
    <resource-plate
      class="py-0"
      title="媒体更新"
      :query="latestUpdateMediaQuery"
      :query-fn="Api.Media.query"
      :icon="mdiPlaylistPlay"
      cols="6"
      sm="4"
      md="3"
      icon-color="primary"
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
      <template #default="{ item: media }">
        <media-overview
          class="pa-2"
          v-ripple
          @click:content="router.push(`/media/${media!.id}`)"
          @click.right.prevent
          :media="media"
        ></media-overview>
      </template>
    </resource-plate>
  </v-container>
</template>

<style scoped lang="sass"></style>
