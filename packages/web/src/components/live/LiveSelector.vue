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
          {{ t('app.entities.live') }}
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
            @click:append-inner="livesLoader.reload()"
            @keydown.enter="livesLoader.reload()"
          >
          </v-text-field>
        </v-container>
        <v-container class="mt-4 d-flex flex-column pa-0">
          <multi-items-loader class="pa-0" auto :loader="livesLoader">
            <v-row>
              <v-col cols="6" sm="4" md="3" v-for="item in lives" :key="item.id">
                <live-overview @click="select(item)" @click.right.prevent :live="item"></live-overview>
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
import { mdiClose, mdiMagnify } from '@mdi/js';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import LiveOverview from '@/components/live/LiveOverview.vue';
import { LiveEntity, LiveQueryDto } from '@/api/interfaces/live.interface';

const { t } = useI18n();
const display = useDisplay();
const api = useApiStore();
const toast = useToastStore();

const props = withDefaults(
  defineProps<{
    owner?: boolean;
    modelValue?: boolean;
  }>(),
  {
    owner: false,
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
  (e: 'selected', item: LiveEntity): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const select = (item: LiveEntity) => {
  emits('selected', item);
  dialog.value = false;
};

const filters: Ref<LiveQueryDto> = ref({
  userId: props.owner ? api.user?.id : undefined,
  keyword: '',
  sort: 'createAt',
  order: 'DESC',
});
const livesLoader = useAxiosPageLoader(
  async (query?: LiveQueryDto) => {
    return await api.Live.query({
      ...query,
      ...filters.value,
    });
  },
  { page: 0, size: 12 },
);
const { items: lives } = livesLoader;
livesLoader.onRejected((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
