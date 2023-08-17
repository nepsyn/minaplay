<script setup lang="ts">
import { useApp } from '@/store/app';
import { useDisplay } from 'vuetify';
import { SeriesEntity, SeriesQueryDto } from '@/interfaces/series.interface';
import { computed, Ref, ref } from 'vue';
import { mdiClose, mdiMagnify } from '@mdi/js';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import { Api } from '@/api/api';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const app = useApp();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const dialog = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const emits = defineEmits<{
  (e: 'selected', item: SeriesEntity): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const query: Ref<SeriesQueryDto> = ref({
  keyword: '',
  page: 0,
  size: 12,
  sort: 'createAt',
  order: 'DESC',
});
const series = ref<SeriesEntity[]>([]);
const loadSeries = async (done: any) => {
  try {
    const response = await Api.Series.query(query.value);
    series.value.push(...response.data.items);
    query.value.page!++;
    done(series.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    done('error');
  }
};
const seriesProvider = ref(null as any);
const search = () => {
  series.value = [];
  query.value.page = 0;
  if (seriesProvider.value) {
    seriesProvider.value.load();
  }
};
</script>

<template>
  <v-dialog
    :class="display.smAndUp.value ? 'w-75' : 'w-100'"
    :fullscreen="!display.smAndUp.value"
    v-model="dialog"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary">
        <v-btn :icon="mdiClose" @click="dialog = false"></v-btn>
        <v-toolbar-title>选择剧集</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column">
          <v-text-field
            label="剧集关键字"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            v-model="query.keyword"
            clearable
            autofocus
            @keydown.enter="search"
          >
            <template #append>
              <action-btn :icon="mdiMagnify" text="搜索" size="large" color="primary" @click="search"></action-btn>
            </template>
          </v-text-field>
        </v-container>
        <v-container class="mt-2 d-flex flex-column">
          <items-provider class="pa-0" ref="seriesProvider" :load-fn="loadSeries" :items="series">
            <v-row no-gutters>
              <v-col cols="4" sm="3" md="2" v-for="item in series" :key="item.id">
                <series-overview
                  class="pa-2"
                  v-ripple
                  @click:content="
                    emits('selected', item);
                    dialog = false;
                  "
                  @click.right.prevent
                  :series="item"
                ></series-overview>
              </v-col>
            </v-row>
          </items-provider>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="sass"></style>
