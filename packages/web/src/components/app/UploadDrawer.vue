<template>
  <v-navigation-drawer
    order="0"
    :width="display.width.value * (display.smAndUp.value ? 0.25 : 0.75)"
    location="right"
    temporary
    v-model="layout.uploadDrawer"
  >
    <v-container fluid class="pa-0 d-flex flex-column h-100">
      <v-container fluid class="pa-0">
        <v-toolbar density="comfortable" color="background" rounded="0">
          <v-toolbar-title>
            {{ t('layout.upload.title') }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn class="me-4" variant="text" color="primary" :icon="mdiPlus" @click="selectAndUploadMedia()"></v-btn>
        </v-toolbar>
        <v-alert class="mx-4 mb-2" variant="tonal" type="warning" density="compact" :icon="mdiInformationOutline">
          {{ t('layout.upload.closePageHint') }}
        </v-alert>
        <v-divider></v-divider>
      </v-container>
      <v-container @dragenter.prevent @dragover.prevent @drop.prevent="onDrop" fluid class="pa-0 scrollable-container">
        <template v-if="uploadFiles.length > 0">
          <upload-media
            v-for="(file, index) in uploadFiles"
            :key="file.name"
            :file="file"
            @close="uploadFiles.splice(index, 1)"
          ></upload-media>
        </template>
        <v-container v-else class="h-100 d-flex justify-center align-center">
          <div class="upload-box d-flex flex-column justify-center align-center">
            <v-btn variant="text" size="40" :icon="mdiPlus" @click="selectAndUploadMedia()"></v-btn>
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
import { mdiInformationOutline, mdiPlus } from '@mdi/js';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UploadMedia from '@/components/app/UploadMedia.vue';
import { selectFile } from '@/utils/utils';

const { t } = useI18n();
const display = useDisplay();
const layout = useLayoutStore();

const uploadFiles = ref<File[]>([]);

const selectAndUploadMedia = () => {
  selectFile('video/*', true, (files) => {
    uploadFiles.value.push(...files);
  });
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
