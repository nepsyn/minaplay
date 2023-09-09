<script setup lang="ts">
import { useApp } from '@/store/app';
import { useDisplay } from 'vuetify';
import { computed, ref, Ref } from 'vue';
import { Api } from '@/api/api';
import { MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';
import { mdiClose, mdiMagnify } from '@mdi/js';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import MediaOverview from '@/components/resource/MediaOverview.vue';

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
  (e: 'selected', item: MediaEntity): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const select = (item: MediaEntity) => {
  emits('selected', item);
  dialog.value = false;
};

const query: Ref<MediaQueryDto> = ref({
  keyword: '',
  page: 0,
  size: 12,
  sort: 'createAt',
  order: 'DESC',
});
const medias = ref<MediaEntity[]>([]);
const loadMedias = async (done: any) => {
  try {
    const response = await Api.Media.query(query.value);
    medias.value.push(...response.data.items);
    query.value.page!++;
    done(medias.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    done('error');
  }
};
const seriesProvider = ref(null as any);
const search = () => {
  medias.value = [];
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
        <v-toolbar-title>选择媒体文件</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column pa-0">
          <v-text-field
            class="px-2"
            label="媒体文件关键字"
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
        <v-container class="mt-2 d-flex flex-column pa-0">
          <items-provider class="pa-0" ref="seriesProvider" :load-fn="loadMedias" :items="medias">
            <v-row no-gutters>
              <v-col cols="6" sm="4" md="3" v-for="item in medias" :key="item.id">
                <media-overview
                  class="pa-2"
                  v-ripple
                  @click:content="select(item)"
                  @click.right.prevent
                  :media="item"
                ></media-overview>
              </v-col>
            </v-row>
          </items-provider>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="sass"></style>
