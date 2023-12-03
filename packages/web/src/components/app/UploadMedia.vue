<template>
  <v-container fluid class="pa-0 d-flex flex-column">
    <v-container fluid class="px-4 py-2 d-flex flex-row align-center justify-space-between">
      <span class="upload-title text-truncate" :title="file.name">{{ file.name }}</span>
      <div class="flex-shrink-0 d-flex flex-row">
        <v-btn
          variant="text"
          v-if="finished && !error"
          size="x-small"
          :icon="mdiShare"
          color="primary"
          @click="router.push({ path: `/media/${media!.id}` })"
        ></v-btn>
        <v-btn
          variant="text"
          v-if="finished"
          size="x-small"
          :icon="mdiClose"
          color="primary"
          @click="emits('close')"
        ></v-btn>
        <div v-else>
          <v-btn variant="text" color="error" size="x-small" v-bind="props" :icon="mdiStop"></v-btn>
          <v-menu activator="parent" min-width="240" offset="y" location="bottom">
            <v-card>
              <v-card-title>
                {{ t('layout.upload.cancelTitle') }}
              </v-card-title>
              <v-card-text>
                {{ t('layout.upload.cancelConfirm') }}
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="plain" @click="doCancel" color="error">{{ t('app.ok') }}</v-btn>
                <v-btn variant="text" color="primary">{{ t('app.cancel') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </div>
      </div>
    </v-container>
    <v-container fluid class="px-4 py-0">
      <v-progress-linear color="primary" :model-value="progress"></v-progress-linear>
    </v-container>
    <v-container
      fluid
      class="px-4 py-2 d-flex flex-row align-center justify-space-between text-truncate upload-caption"
    >
      <span>{{ filesize(file.size) }}</span>
      <template v-if="finished">
        <span class="text-error text-truncate" v-if="error">{{ error }}</span>
        <span v-else class="text-success">
          {{ t('layout.upload.status.finished') }}
        </span>
      </template>
      <template v-else>
        <span v-if="progress >= 100">
          {{ t('layout.upload.status.generating') }}
        </span>
        <span v-else>
          {{ `${progress.toFixed(2)} %` }}
        </span>
      </template>
    </v-container>
    <v-divider></v-divider>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { MediaEntity } from '@/api/interfaces/media.interface';
import { mdiClose, mdiShare, mdiStop } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { filesize } from 'filesize';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();

const props = defineProps<{
  file: File;
}>();

const progress = ref(0);
const finished = ref(false);
const error = ref<string | undefined>(undefined);
const controller = new AbortController();

const media = ref<MediaEntity | undefined>(undefined);

const doCancel = () => {
  controller.abort();
  finished.value = true;
};

const emits = defineEmits(['close', 'uploaded', 'error']);

onMounted(async () => {
  if (props.file.size > 4294967296) {
    progress.value = 100;
    finished.value = true;
    error.value = t('layout.upload.status.sizeExceed');
    return;
  }

  try {
    const fileResponse = await api.File.uploadVideo(
      props.file,
      (event) => {
        progress.value = event.progress! * 100;
      },
      controller.signal,
    );

    const mediaResponse = await api.Media.create({
      fileId: fileResponse.data.id,
      name: fileResponse.data.name,
    });

    media.value = mediaResponse.data;
    emits('uploaded', media);
  } catch (e: any) {
    if (controller.signal.aborted) {
      error.value = t('layout.upload.status.canceled');
    } else if (e.response?.data.code === ErrorCodeEnum.INVALID_VIDEO_FILE_TYPE) {
      error.value = t('layout.upload.status.wrongType');
    } else if (e.response?.data.code === ErrorCodeEnum.INVALID_FILE) {
      error.value = t('layout.upload.status.wrongContent');
    } else {
      error.value = t('layout.upload.status.error');
    }
    emits('error');
  } finally {
    finished.value = true;
  }
});
</script>

<style scoped lang="sass">
.upload-title
  font-size: 1rem
  font-weight: 500

.upload-caption
  font-size: 0.875rem
  font-weight: 400
  color: grey
</style>
