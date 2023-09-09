<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { SeriesEntity, SeriesTagEntity } from '@/interfaces/series.interface';
import { Api } from '@/api/api';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useApp } from '@/store/app';
import { mdiCheck, mdiClose, mdiCloudUploadOutline } from '@mdi/js';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';
import { useDisplay } from 'vuetify';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import _ from 'lodash';

const app = useApp();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    item: SeriesEntity;
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
  (e: 'saved', item: SeriesEntity): any;
  (e: 'error', error: any): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const editLoading = ref(false);
const saveEdit = async () => {
  if (props.item.name === undefined || String(props.item.name).trim().length === 0) {
    app.toastError('剧集名称不可为空');
    return;
  }

  editLoading.value = true;
  try {
    const action = props.item?.id !== undefined ? Api.Series.update(props.item.id) : Api.Series.create;
    const response = await action({
      name: props.item.name,
      description: props.item.description,
      posterFileId: props.item.poster?.id,
      tagIds: props.item.tags?.map(({ id }) => id) ?? [],
    });
    emits('saved', response.data);
    dialog.value = false;
  } catch (error: any) {
    emits('error', error);
  } finally {
    editLoading.value = false;
  }
};
const posterUploading = ref(false);
const selectAndUploadPoster = () => {
  app.selectFile('image/*', async (file) => {
    posterUploading.value = true;
    try {
      const response = await Api.File.uploadImage(file);
      props.item.poster = response.data;
    } catch (error: any) {
      if (error?.response?.data?.code === ErrorCodeEnum.INVALID_IMAGE_FILE_TYPE) {
        app.toastError('图片类型错误');
      } else {
        app.toastError('图片上传失败');
      }
    } finally {
      posterUploading.value = false;
    }
  });
};
const searchTag = ref('');
const tags = ref<SeriesTagEntity[]>([]);
const tagsLoading = ref(false);
watch(
  () => [searchTag.value],
  async () => await queryTags(),
);
const tagSaving = ref(false);
const saveTag = async (name: string) => {
  if (name && name?.trim().length > 0) {
    tagSaving.value = true;
    try {
      let tag = tags.value.find((t) => t.name === name);
      if (!tag) {
        const response = await Api.SeriesTag.create({ name });
        tag = response.data;
      }

      if (!props.item.tags?.some((t) => t.name === name)) {
        props.item.tags ??= [];
        props.item.tags.push(tag);
      }

      searchTag.value = '';
    } finally {
      tagSaving.value = false;
    }
  }
};
const queryTags = _.debounce(
  async () => {
    tagsLoading.value = true;
    try {
      const response = await Api.SeriesTag.query({ keyword: searchTag.value || undefined, size: 1024 });
      tags.value = response.data.items;
    } catch {
      app.toastError('获取剧集标签失败');
    } finally {
      tagsLoading.value = false;
    }
  },
  1000,
  { leading: false, trailing: true },
);
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
        <v-toolbar-title>编辑{{ item?.id !== undefined ? '剧集信息' : '新剧集信息' }}</v-toolbar-title>
        <action-btn :icon="mdiCheck" text="保存" variant="text" :loading="editLoading" @click="saveEdit"></action-btn>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column pa-0">
          <v-container class="pa-0">
            <span class="text-body-1">名称</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="item.name"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1">描述</span>
            <v-textarea
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              rows="3"
              v-model="item.description"
            ></v-textarea>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1">标签</span>
            <v-autocomplete
              :readonly="tagSaving"
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              return-object
              chips
              clearable
              :loading="tagsLoading"
              hide-no-data
              item-title="name"
              density="compact"
              :items="tags"
              multiple
              v-model="item.tags"
              v-model:search.trim="searchTag"
              @focus.once="queryTags"
              @keydown.enter="saveTag(searchTag)"
            >
              <template #append-inner>
                <v-progress-circular v-if="tagSaving" indeterminate color="primary"></v-progress-circular>
              </template>
            </v-autocomplete>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1">海报图片</span>
            <v-row class="mt-1">
              <v-col cols="12" md="4">
                <v-img
                  :aspect-ratio="1 / 1.4"
                  class="rounded"
                  cover
                  min-width="80"
                  :src="item.poster ? Api.File.buildRawPath(item.poster.id) : SeriesCoverFallback"
                >
                  <template #placeholder>
                    <v-img :src="SeriesCoverFallback"></v-img>
                  </template>
                </v-img>
                <v-btn
                  class="mt-2"
                  :prepend-icon="mdiCloudUploadOutline"
                  color="warning"
                  text="上传图片"
                  variant="outlined"
                  block
                  :loading="posterUploading"
                  @click="selectAndUploadPoster"
                ></v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="sass"></style>
