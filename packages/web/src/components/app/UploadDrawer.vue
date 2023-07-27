<script setup lang="ts">
import { useApp } from '@/store/app';
import { mdiPlus } from '@mdi/js';
import UploadMedia from '@/components/app/UploadMedia.vue';
import { useDisplay } from 'vuetify';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const app = useApp();
const display = useDisplay();

const selectAndUploadMedia = () => {
  const el = document.createElement('input');
  el.accept = 'video/*';
  el.type = 'file';
  el.onchange = async (e) => {
    const file: File = (e.target as any).files[0];
    if (file) {
      app.uploadFiles.push(file);
    }
  };
  el.click();
};

const onDrop = (e: DragEvent) => {
  app.uploadFiles.push(...Array.from(e.dataTransfer?.files ?? []));
};
</script>

<template>
  <v-navigation-drawer
    order="0"
    :class="display.smAndUp.value ? 'w-25' : 'w-75'"
    location="right"
    temporary
    v-model="app.uploadDrawer"
  >
    <v-container fluid class="pa-0 d-flex flex-column h-100">
      <v-container fluid class="pa-0">
        <v-toolbar color="background" rounded="0">
          <v-toolbar-title>上传列表</v-toolbar-title>
          <v-spacer></v-spacer>
          <action-btn
            class="me-4"
            text="选择文件"
            color="primary"
            :icon="mdiPlus"
            @click="selectAndUploadMedia"
          ></action-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </v-container>
      <v-container @dragenter.prevent @dragover.prevent @drop.prevent="onDrop" fluid class="pa-0 scrollable-container">
        <template v-if="app.uploadFiles.length > 0">
          <upload-media
            v-for="(file, index) in app.uploadFiles"
            :key="index"
            :file="file"
            @close="app.uploadFiles.splice(index, 1)"
          ></upload-media>
        </template>
        <v-container v-else class="h-100 d-flex justify-center align-center">
          <div class="upload-box d-flex flex-column justify-center align-center">
            <v-icon size="40" :icon="mdiPlus"></v-icon>
            <span class="text-body-2 mt-2">将媒体文件拖动到此处上传</span>
          </div>
        </v-container>
      </v-container>
    </v-container>
  </v-navigation-drawer>
</template>

<style scoped lang="sass">
.upload-box
  border-radius: 4px
  border: 2px dashed grey
  width: calc(100% - 8px)
  height: calc(100% - 8px)
</style>
