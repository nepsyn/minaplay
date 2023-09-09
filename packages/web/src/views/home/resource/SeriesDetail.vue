<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { computed, ref, Ref } from 'vue';
import { EpisodeEntity, SeriesEntity } from '@/interfaces/series.interface';
import { Api } from '@/api/api';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { VSkeletonLoader } from 'vuetify/labs/components';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';
import ViewImg from '@/components/provider/ViewImg.vue';
import { mdiMotionPlayOutline, mdiPlay, mdiViewComfy } from '@mdi/js';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import { ApiQueryDto } from '@/interfaces/common.interface';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const seriesId = computed(() => Number(route.params.id));

const series: Ref<SeriesEntity> = ref(undefined as any);
const loadSeries = async (done: any) => {
  try {
    const response = await Api.Series.getById(seriesId.value)();
    series.value = response.data;
    done('ok');
  } catch {
    app.toastError('获取剧集失败');
    done('error');
  }
};

const episodesQuery: ApiQueryDto<EpisodeEntity> = {
  page: 0,
  size: 100,
  sort: 'createAt',
  order: 'ASC',
};
const episodes = ref<EpisodeEntity[]>([]);
const episodesTotal = ref(0);
const loadEpisodes = async (done: any) => {
  try {
    const response = await Api.Episode.query({
      ...episodesQuery,
      seriesId: seriesId.value,
    });
    episodes.value.push(...response.data.items);
    episodesTotal.value = response.data.total;
    episodesQuery.page!++;
    done(episodes.value.length === episodesTotal.value ? 'empty' : 'ok');
  } catch (e) {
    app.toastError('获取单集列表失败');
    done('error');
  }
};
</script>

<template>
  <v-container fluid class="py-4 px-6">
    <v-container fluid class="border rounded-lg">
      <single-item-provider :item="series" :load-fn="loadSeries">
        <template #loading>
          <v-row>
            <v-col class="d-none d-sm-block" cols="3">
              <v-skeleton-loader type="image,image"></v-skeleton-loader>
            </v-col>
            <v-col cols="12" sm="9">
              <v-skeleton-loader type="article,article"></v-skeleton-loader>
            </v-col>
          </v-row>
        </template>
        <v-container fluid class="pa-0 d-flex flex-column">
          <v-row>
            <v-col class="d-none d-sm-block" cols="3">
              <view-img
                class="rounded"
                :aspect-ratio="1 / 1.4"
                :src="series.poster ? Api.File.buildRawPath(series.poster.id) : SeriesCoverFallback"
                :placeholder="SeriesCoverFallback"
              ></view-img>
            </v-col>
            <v-col cols="12" sm="9" class="d-flex flex-column justify-space-between">
              <div>
                <span class="text-h4 text-break">{{ series.name }}</span>
                <div class="mt-2">
                  <v-chip
                    color="primary"
                    class="me-2 mt-1"
                    v-for="(tag, index) in series.tags"
                    :key="index"
                    label
                    :text="tag.name"
                  ></v-chip>
                </div>
                <v-divider class="my-2"></v-divider>
                <v-row>
                  <v-col class="d-block d-sm-none" cols="4">
                    <view-img
                      class="rounded"
                      :aspect-ratio="1 / 1.4"
                      :src="series.poster ? Api.File.buildRawPath(series.poster.id) : SeriesCoverFallback"
                      :placeholder="SeriesCoverFallback"
                    ></view-img>
                  </v-col>
                  <v-col cols="8" sm="12">
                    <pre
                      style="min-height: 100px"
                      class="text-subtitle-1 text-pre-wrap text-break bg-transparent"
                      v-text="series.description ?? '暂无剧集描述'"
                    ></pre>
                  </v-col>
                </v-row>
              </div>
              <div>
                <v-divider class="my-2"></v-divider>
                <v-btn
                  variant="flat"
                  text="立即播放"
                  :prepend-icon="mdiPlay"
                  color="secondary"
                  :disabled="episodes.length === 0"
                  @click="router.push({ path: `/ep/${episodes[0].id}` })"
                ></v-btn>
                <v-btn
                  class="ms-2"
                  variant="flat"
                  text="一起看"
                  :prepend-icon="mdiMotionPlayOutline"
                  color="secondary"
                  :disabled="episodes.length === 0"
                ></v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </single-item-provider>
    </v-container>
    <v-container fluid class="mt-6 border rounded-lg">
      <items-provider :load-fn="loadEpisodes" :items="episodes" :hide-empty="episodes.length > 0">
        <v-container fluid class="pa-0 d-flex align-center">
          <v-icon :icon="mdiViewComfy"></v-icon>
          <span class="ms-2 text-h6">分集</span>
        </v-container>
        <v-container fluid class="mt-3 pa-0">
          <v-btn
            v-for="(episode, index) in episodes"
            :key="index"
            class="me-2 mt-1 text-truncate"
            variant="outlined"
            :text="episode.no || episode.media.name"
            @click="router.push({ path: `/ep/${episode.id}` })"
          ></v-btn>
        </v-container>
      </items-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
