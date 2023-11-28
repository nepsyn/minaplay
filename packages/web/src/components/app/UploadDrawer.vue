<template>
  <v-navigation-drawer
    order="0"
    :class="display.smAndUp.value ? 'w-25' : 'w-75'"
    location="right"
    temporary
    v-model="layout.uploadDrawer"
  >
    <v-container fluid class="pa-0 d-flex flex-column h-100">
      <v-container fluid class="pa-0">
        <v-toolbar color="background" rounded="0">
          <v-toolbar-title>
            {{ t('layout.upload.title') }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn class="mr-4" variant="text" color="primary" :icon="mdiPlus" @click="selectAndUploadMedia"></v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </v-container>
      <v-container @dragenter.prevent @dragover.prevent @drop.prevent="onDrop" fluid class="pa-0 scrollable-container">
        <template v-if="uploadFiles.length > 0">
          <upload-media
            v-for="(file, index) in uploadFiles"
            :key="index"
            :file="file"
            @close="uploadFiles.splice(index, 1)"
          ></upload-media>
        </template>
        <v-container v-else class="h-100 d-flex justify-center align-center">
          <div class="upload-box d-flex flex-column justify-center align-center">
            <v-icon size="40" :icon="mdiPlus"></v-icon>
            <span class="text-body-2 mt-2">
              {{ t('layout.upload.drop') }}
            </span>
          </div>
        </v-container>
      </v-container>
    </v-container>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { useLayoutStore } from '@/store/layout';
import { mdiPlus } from '@mdi/js';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UploadMedia from '@/components/app/UploadMedia.vue';

const { t } = useI18n();
const display = useDisplay();
const layout = useLayoutStore();

const uploadFiles = ref<File[]>([]);

const selectAndUploadMedia = () => {
  const el = document.createElement('input');
  el.accept = 'video/*';
  el.type = 'file';
  el.onchange = async (e) => {
    const file: File = (e.target as any).files[0];
    if (file) {
      uploadFiles.value.push(file);
    }
  };
  el.click();
};

const onDrop = (e: DragEvent) => {
  uploadFiles.value.push(...Array.from(e.dataTransfer?.files ?? []));
};
</script>

<style scoped lang="sass">
.upload-box
  border-radius: 4px
  border: 2px dashed grey
  width: calc(100% - 8px)
  height: calc(100% - 8px)
</style>
