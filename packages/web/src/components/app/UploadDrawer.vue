<script setup lang="ts">
import { useApp } from '@/store/app';
import { mdiPlus } from '@mdi/js';
import UploadMedia from '@/components/app/UploadMedia.vue';

const app = useApp();

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
  <v-navigation-drawer order="0" width="360" location="right" temporary v-model="app.uploadDrawer">
    <v-container fluid class="pa-0 d-flex flex-column fill-height">
      <v-container fluid class="pa-0">
        <v-toolbar color="background" rounded="0">
          <v-toolbar-title>上传列表</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn class="mr-5" color="primary" variant="outlined" :append-icon="mdiPlus" @click="selectAndUploadMedia">
            选择文件
          </v-btn>
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
        <v-container v-else class="fill-height d-flex justify-center align-center">
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
