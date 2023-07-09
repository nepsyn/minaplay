<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { mdiClose, mdiShare, mdiStop } from '@mdi/js';
import { filesize } from 'filesize';
import { Api } from '@/api/api';
import { MediaEntity } from '@/interfaces/media.interface';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useRouter } from 'vue-router';

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
    error.value = '上传失败，文件过大(> 10GB)';
    return;
  }

  try {
    const fileResponse = await Api.File.uploadVideo(
      props.file,
      (event) => {
        progress.value = event.progress! * 100;
      },
      controller.signal,
    );

    const mediaResponse = await Api.Media.create({
      fileId: fileResponse.data.id,
      name: fileResponse.data.name,
    });

    media.value = mediaResponse.data;
    emits('uploaded', media);
  } catch (e: any) {
    if (controller.signal.aborted) {
      error.value = '已取消上传';
    } else if (e.response?.data.code === ErrorCodeEnum.INVALID_VIDEO_FILE_TYPE) {
      error.value = '上传失败，错误的媒体文件类型';
    } else if (e.response?.data.code === ErrorCodeEnum.INVALID_FILE) {
      error.value = '上传失败，错误的文件内容';
    } else if (e.response?.data.code === ErrorCodeEnum.BAD_REQUEST) {
      error.value = '上传失败，错误的请求';
    } else {
      error.value = '上传失败';
    }
    emits('error');
  } finally {
    finished.value = true;
  }
});
</script>

<template>
  <v-container fluid class="pa-0 d-flex flex-column">
    <v-container fluid class="px-4 py-2 d-flex flex-row align-center justify-space-between">
      <span class="upload-title text-truncate" :title="file.name">{{ file.name }}</span>
      <div class="flex-shrink-0">
        <v-btn
          variant="text"
          v-if="finished && !error"
          size="x-small"
          :icon="mdiShare"
          color="primary"
          @click="router.push(`/media/${media!.id}`)"
        ></v-btn>
        <v-btn
          variant="text"
          v-if="finished"
          size="x-small"
          :icon="mdiClose"
          color="primary"
          @click="emits('close')"
        ></v-btn>
        <v-menu v-else min-width="240" offset="y" location="bottom">
          <template #activator="{ props }">
            <v-btn variant="text" color="error" size="x-small" v-bind="props" :icon="mdiStop"></v-btn>
          </template>
          <v-card flat rounded="0">
            <v-card-text>
              <h4 class="pb-2">确定取消</h4>
              <span>确定要取消上传文件吗？</span>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="plain" @click="doCancel" color="error">确定</v-btn>
              <v-btn variant="text" color="primary">取消</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
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
        <span v-else class="text-success">已完成</span>
      </template>
      <template v-else>
        <span>{{ progress.toFixed(2) }} %</span>
      </template>
    </v-container>
    <v-divider></v-divider>
  </v-container>
</template>

<style scoped lang="sass">
.upload-title
  font-size: 1rem
  font-weight: 500

.upload-caption
  font-size: 0.875rem
  font-weight: 400
  color: grey
</style>
