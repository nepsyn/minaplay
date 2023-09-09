<script setup lang="ts">
import { useApp } from '@/store/app';
import { useDisplay } from 'vuetify';
import { computed, ref } from 'vue';
import { Api } from '@/api/api';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { MediaEntity } from '@/interfaces/media.interface';
import { mdiCheck, mdiClose, mdiCloudUploadOutline } from '@mdi/js';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const app = useApp();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    item: MediaEntity;
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
  (e: 'saved', item: MediaEntity): any;
  (e: 'error', error: any): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const editLoading = ref(false);
const saveEdit = async () => {
  if (props.item.name === undefined || String(props.item.name).trim().length === 0) {
    app.toastError('媒体文件名称不可为空');
    return;
  }

  editLoading.value = true;
  try {
    const action = props.item?.id !== undefined ? Api.Media.update(props.item.id) : Api.Media.create;
    const response = await action({
      name: props.item.name,
      description: props.item.description,
      posterFileId: props.item.poster?.id,
      isPublic: props.item.isPublic,
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
const selectAndUploadPoster = async () => {
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
        <v-toolbar-title>编辑{{ item?.id !== undefined ? '媒体文件信息' : '新媒体文件信息' }}</v-toolbar-title>
        <action-btn :icon="mdiCheck" text="保存" variant="text" :loading="editLoading" @click="saveEdit"></action-btn>
      </v-toolbar>
      <v-card-text>
        <v-container class="d-flex flex-column pa-0">
          <v-container class="pa-0">
            <span class="text-body-1">标题</span>
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
            <v-switch inset hide-details color="primary" density="compact" v-model="item.isPublic">
              <template #prepend>
                <span class="text-body-1"> 是否公开 </span>
              </template>
            </v-switch>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1">封面图片</span>
            <v-row class="mt-1">
              <v-col cols="12" md="8">
                <v-img
                  class="rounded"
                  cover
                  min-width="80"
                  :src="item.poster ? Api.File.buildRawPath(item.poster.id) : MediaCoverFallback"
                >
                  <template #placeholder>
                    <v-img :src="MediaCoverFallback"></v-img>
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
