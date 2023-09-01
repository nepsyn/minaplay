<script setup lang="ts">
import { useApp } from '@/store/app';
import { ApiQueryDto } from '@/interfaces/common.interface';
import { Ref, ref } from 'vue';
import { VSkeletonLoader } from 'vuetify/labs/components';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';

const app = useApp();

const props = withDefaults(
  defineProps<{
    iconColor?: string;
    icon: string;
    title: string;
    query: ApiQueryDto<any>;
    queryFn: Function;
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

const items = ref<any[]>([]);
const load = async (done: any) => {
  try {
    const response = await props.queryFn(props.query);
    items.value.push(...response.data.items);
    props.query.page!++;
    done(items.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    done('error');
  }
};
const reset = () => {
  props.query.page = 0;
  items.value = [];
};

defineExpose({ load, reset });

const providerRef: Ref<any> = ref(null);
</script>

<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="px-2 d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" :color="iconColor!" :icon="icon"></v-icon>
        <span class="ml-2 text-h5">{{ title }}</span>
      </v-container>
      <v-spacer></v-spacer>
      <slot name="actions" :load="providerRef?.load" :reset="reset" :status="providerRef?.status"></slot>
    </v-container>
    <items-provider class="pa-0" ref="providerRef" :load-fn="load" :items="items" :hide-empty="items.length > 0">
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
          v-for="(item, index) in items"
          :key="index"
        >
          <slot :item="item"></slot>
        </v-col>
      </v-row>
    </items-provider>
  </v-container>
</template>

<style scoped lang="sass"></style>
