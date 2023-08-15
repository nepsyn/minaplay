<script setup lang="ts">
import { VSkeletonLoader } from 'vuetify/labs/components';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import { MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';
import { ref, Ref } from 'vue';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import { Api } from '@/api/api';
import { useApp } from '@/store/app';

const app = useApp();

const props = withDefaults(
  defineProps<{
    iconColor?: string;
    icon: string;
    title: string;
    query: MediaQueryDto;
    count?: string | number;
    cols?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    xxl?: string | number;
  }>(),
  {
    iconColor: 'primary',
    cols: 3,
    count: 8,
  },
);

const emits = defineEmits<{
  (event: 'click:media', arg: MediaEntity): void;
}>();

const medias = ref<MediaEntity[]>([]);
const load = async (done: any) => {
  try {
    const response = await Api.Media.query(props.query);
    medias.value.push(...response.data.items);
    props.query.page!++;
    done(medias.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    done('error');
  }
};
const reset = () => {
  props.query.page = 0;
  medias.value = [];
};

defineExpose({ load, reset });

const providerRef: Ref<any> = ref(null);
</script>

<template>
  <v-container fluid>
    <v-container fluid class="px-3 d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" :color="iconColor!" :icon="icon"></v-icon>
        <span class="ml-2 text-h5">{{ title }}</span>
      </v-container>
      <v-spacer></v-spacer>
      <slot name="actions" :load="providerRef?.load" :reset="reset" :status="providerRef?.status"></slot>
    </v-container>
    <items-provider class="pa-0" ref="providerRef" :load-fn="load" :items="medias" :hide-empty="medias.length > 0">
      <template #loading>
        <v-row no-gutters>
          <v-col
            :cols="cols!"
            :sm="sm!"
            :md="md!"
            :lg="lg!"
            :xl="xl!"
            :xxl="xxl!"
            v-for="index of Number(count)"
            :key="index"
          >
            <v-skeleton-loader class="pa-3" type="image,list-item-two-line"></v-skeleton-loader>
          </v-col>
        </v-row>
      </template>
      <v-row no-gutters>
        <v-col
          :cols="cols!"
          :sm="sm!"
          :md="md!"
          :lg="lg!"
          :xl="xl!"
          :xxl="xxl!"
          v-for="media in medias"
          :key="media.id"
        >
          <media-overview
            class="pa-3"
            v-ripple
            @click:content="emits('click:media', media)"
            @click.right.prevent
            :media="media"
          ></media-overview>
        </v-col>
      </v-row>
    </items-provider>
  </v-container>
</template>

<style scoped lang="sass"></style>
