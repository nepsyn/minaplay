<script setup lang="ts">
import { ref } from 'vue';
import { SeriesEntity } from '@/interfaces/series.interface';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import { VSkeletonLoader } from 'vuetify/labs/components';
import { Api } from '@/api/api';
import { useApp } from '@/store/app';
import { VCarousel } from 'vuetify/components';

const app = useApp();

const tab = ref(0);
const series = ref<SeriesEntity[]>([]);
const carousel = ref<VCarousel>(null as any);
const height = ref(500);
const onResize = () => {
  if (carousel.value) {
    height.value = (carousel.value.$el.clientWidth * 3) / 7;
  }
};
const load = async (done: any) => {
  try {
    const response = await Api.Series.query({
      page: 0,
      size: 10,
    });
    series.value = response.data.items;
    done('ok');
  } catch {
    app.toastError('获取剧集列表失败');
    done('error');
  }
};
</script>

<template>
  <v-container fluid>
    <items-provider :load-fn="load" :items="series" hide-load-more>
      <v-carousel
        ref="carousel"
        v-resize="onResize"
        :show-arrows="false"
        v-model="tab"
        class="rounded-lg"
        hide-delimiter-background
        color="secondary-lighten-2"
        cycle
        :height="height"
      >
        <v-carousel-item
          v-for="(item, index) in series"
          :key="index"
          :aspect-ratio="16 / 9"
          :src="item.posterLandscape ? Api.File.buildRawPath(item.posterLandscape.id) : MediaCoverFallback"
          cover
        >
        </v-carousel-item>
        <v-carousel-item v-if="series.length === 0" :src="MediaCoverFallback" cover>
          <v-img></v-img>
        </v-carousel-item>
      </v-carousel>
      <template #loading>
        <v-skeleton-loader></v-skeleton-loader>
      </template>
    </items-provider>
  </v-container>
</template>

<style scoped lang="sass"></style>
