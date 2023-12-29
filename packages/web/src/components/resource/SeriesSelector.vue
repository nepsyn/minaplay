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
        <v-toolbar-title>
          {{ t('app.actions.select') }}
          {{ t('app.entities.series') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column pa-0">
          <v-text-field
            :label="t('app.input.keyword')"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            v-model="filters.keyword"
            clearable
            autofocus
            :append-inner-icon="mdiMagnify"
            @click:append-inner="search()"
            @keydown.enter="search()"
          >
          </v-text-field>
        </v-container>
        <v-container class="mt-4 d-flex flex-column pa-0">
          <multi-items-loader class="pa-0" auto :loader="seriesLoader">
            <v-row>
              <v-col cols="4" sm="3" md="2" v-for="item in series" :key="item.id">
                <series-overview @click="select(item)" @click.right.prevent :series="item"></series-overview>
              </v-col>
            </v-row>
          </multi-items-loader>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { SeriesEntity, SeriesQueryDto } from '@/api/interfaces/series.interface';
import { computed, Ref, ref } from 'vue';
import { mdiClose, mdiMagnify } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useToastStore } from '@/store/toast';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const { t } = useI18n();
const display = useDisplay();
const api = useApiStore();
const toast = useToastStore();

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

const select = (item: SeriesEntity) => {
  emits('selected', item);
  dialog.value = false;
};

const filters: Ref<SeriesQueryDto> = ref({
  keyword: '',
  sort: 'createAt',
  order: 'DESC',
});
const seriesLoader = useAxiosPageLoader(
  async (query?: SeriesQueryDto) => {
    return await api.Series.query({
      ...(query ?? {}),
      ...filters.value,
    });
  },
  { page: 0, size: 12 },
);
const series = computed(() => seriesLoader.items.value);
seriesLoader.onRejected((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
const search = async () => {
  seriesLoader.reset();
  await seriesLoader.request();
};
</script>

<style scoped lang="sass"></style>
