<script setup lang="ts">
import { useApp } from '@/store/app';
import { VSkeletonLoader } from 'vuetify/labs/components';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import { Ref, ref } from 'vue';
import { Api } from '@/api/api';
import { SeriesEntity, SeriesQueryDto } from '@/interfaces/series.interface';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const app = useApp();

const props = withDefaults(
  defineProps<{
    iconColor?: string;
    icon: string;
    title: string;
    query: SeriesQueryDto;
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
    cols: 2,
    count: 6,
  },
);

const emits = defineEmits<{
  (event: 'click:series', arg: SeriesEntity): void;
}>();

const series = ref<SeriesEntity[]>([]);
const load = async (done: any) => {
  try {
    const response = await Api.Series.query(props.query);
    series.value.push(...response.data.items);
    props.query.page!++;
    done(series.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    done('error');
  }
};
const reset = () => {
  props.query.page = 0;
  series.value = [];
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
    <items-provider class="pa-0" ref="providerRef" :load-fn="load" :items="series" :hide-empty="series.length > 0">
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
            <v-skeleton-loader class="pa-3" type="image,list-item"></v-skeleton-loader>
          </v-col>
        </v-row>
      </template>
      <v-row no-gutters>
        <v-col :cols="cols!" :sm="sm!" :md="md!" :lg="lg!" :xl="xl!" :xxl="xxl!" v-for="item in series" :key="item.id">
          <series-overview
            class="pa-3"
            v-ripple
            @click:content="emits('click:series', item)"
            @click.right.prevent
            :series="item"
          ></series-overview>
        </v-col>
      </v-row>
    </items-provider>
  </v-container>
</template>

<style scoped lang="sass"></style>
