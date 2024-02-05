<template>
  <v-dialog
    :class="display.smAndUp.value ? 'w-75' : 'w-100'"
    :fullscreen="!display.smAndUp.value"
    v-model="dialog"
    scrollable
    close-on-back
  >
    <v-card>
      <v-toolbar color="primary">
        <v-btn :icon="mdiClose" @click="dialog = false"></v-btn>
        <v-toolbar-title>
          {{ t('app.actions.select') }}
          {{ t('app.entities.media') }}
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
          <multi-items-loader class="pa-0" auto :loader="mediasLoader">
            <v-row>
              <v-col cols="6" sm="4" md="3" v-for="item in medias" :key="item.id">
                <media-overview @click="select(item)" @click.right.prevent :media="item"></media-overview>
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
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { computed, ref, Ref } from 'vue';
import { MediaEntity, MediaQueryDto } from '@/api/interfaces/media.interface';
import { mdiClose, mdiMagnify } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import MediaOverview from '@/components/resource/MediaOverview.vue';

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
  (e: 'selected', item: MediaEntity): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const select = (item: MediaEntity) => {
  emits('selected', item);
  dialog.value = false;
};

const filters: Ref<MediaQueryDto> = ref({
  keyword: '',
  sort: 'createAt',
  order: 'DESC',
});
const mediasLoader = useAxiosPageLoader(
  async (query?: MediaQueryDto) => {
    return await api.Media.query({
      ...query,
      ...filters.value,
    });
  },
  { page: 0, size: 12 },
);
const { items: medias } = mediasLoader;
mediasLoader.onRejected((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
const search = async () => {
  mediasLoader.reset();
  await mediasLoader.request();
};
</script>

<style scoped lang="sass"></style>
