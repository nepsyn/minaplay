<script setup lang="ts">
import { VSkeletonLoader } from 'vuetify/labs/components';
import MediaOverview from '@/components/MediaOverview.vue';
import { MediaEntity } from '@/interfaces/media.interface';

const props = withDefaults(
  defineProps<{
    iconColor?: string;
    icon: string;
    title: string;
    cols?: string | number;
    loading?: boolean;
    medias?: MediaEntity[];
    count?: string | number;
  }>(),
  {
    iconColor: 'primary',
    cols: 4,
    loading: true,
    medias: [] as any,
    count: 8,
  },
);
</script>

<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="my-2 px-0 d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="x-large" :color="iconColor!">{{ icon }}</v-icon>
        <span class="ml-2 text-h5">{{ title }}</span>
      </v-container>
      <v-spacer></v-spacer>
      <slot name="actions"></slot>
    </v-container>
    <v-row>
      <template v-if="loading">
        <v-col :cols="12 / Number(cols)" v-for="index of Number(count)" :key="index">
          <v-skeleton-loader type="image,list-item-two-line"></v-skeleton-loader>
        </v-col>
      </template>
      <template v-else>
        <v-col :cols="12 / Number(cols)" v-for="media in medias" :key="media.id">
          <media-overview @click="$emit('media-click', media)" class="pa-2" :media="media"></media-overview>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass"></style>
