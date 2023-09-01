<script setup lang="ts">
import { useApp } from '@/store/app';
import { useDisplay } from 'vuetify';
import { EpisodeEntity } from '@/interfaces/series.interface';
import { computed, ref } from 'vue';
import { Api } from '@/api/api';
import { mdiCheck, mdiClose, mdiMagnify } from '@mdi/js';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import SelectSeriesDialog from '@/components/dialogs/SelectSeriesDialog.vue';
import SelectMediaDialog from '@/components/dialogs/SelectMediaDialog.vue';

const app = useApp();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    item: EpisodeEntity;
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
  (e: 'saved', item: EpisodeEntity): any;
  (e: 'error', error: any): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const editLoading = ref(false);
const saveEdit = async () => {
  if (props.item.no === undefined || String(props.item.no).trim().length === 0) {
    app.toastError('单集集数不可为空');
    return;
  }
  if (props.item.series === undefined) {
    app.toastError('未选择剧集');
    return;
  }

  editLoading.value = true;
  try {
    const action = props.item?.id !== undefined ? Api.Episode.update(props.item.id) : Api.Episode.create;
    const response = await action({
      no: props.item.no,
      title: props.item.title,
      seriesId: props.item.series?.id,
      mediaId: props.item.media.id,
    });
    emits('saved', response.data);
    dialog.value = false;
  } catch (error: any) {
    emits('error', error);
  } finally {
    editLoading.value = false;
  }
};

const seriesDialog = ref(false);
const mediaDialog = ref(false);
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
        <v-toolbar-title>编辑{{ item?.id !== undefined ? '单集信息' : '新单集信息' }}</v-toolbar-title>
        <action-btn :icon="mdiCheck" text="保存" variant="text" :loading="editLoading" @click="saveEdit"></action-btn>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column">
          <v-container class="pa-0">
            <span class="text-body-1">集数</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="item.no"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1">标题</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="item.title"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <v-row class="mt-1">
              <v-col cols="4">
                <span class="text-body-1">所属剧集</span>
                <v-container fluid class="rounded border my-2">
                  <series-overview v-if="item.series" :series="item.series"></series-overview>
                  <span v-else class="text-caption text-medium-emphasis">未选择剧集</span>
                </v-container>
                <v-btn
                  class="mt-2"
                  :prepend-icon="mdiMagnify"
                  color="warning"
                  text="选择剧集"
                  variant="outlined"
                  block
                  @click="seriesDialog = true"
                ></v-btn>
              </v-col>
              <v-col cols="8">
                <span class="text-body-1">媒体文件</span>
                <v-container fluid class="rounded border my-2">
                  <media-overview v-if="item.media" :media="item.media"></media-overview>
                  <span v-else class="text-caption text-medium-emphasis">未选择媒体文件</span>
                </v-container>
                <v-btn
                  class="mt-2"
                  :prepend-icon="mdiMagnify"
                  color="warning"
                  text="选择媒体文件"
                  variant="outlined"
                  block
                  @click="mediaDialog = true"
                ></v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-container>
      </v-card-text>
    </v-card>
    <select-series-dialog
      v-model="seriesDialog"
      @selected="(series) => (props.item.series = series)"
    ></select-series-dialog>
    <select-media-dialog v-model="mediaDialog" @selected="(media) => (props.item.media = media)"></select-media-dialog>
  </v-dialog>
</template>

<style scoped lang="sass"></style>
