<script setup lang="ts">
import { MediaEntity } from '@/interfaces/media.interface';
import { computed, onMounted, ref } from 'vue';
import { Api } from '@/api/api';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import TimeAgo from '@/components/provider/TimeAgo.vue';

const props = withDefaults(
  defineProps<{
    media: MediaEntity;
    showChips?: boolean;
  }>(),
  {
    showChips: true,
  },
);

const sourceText = computed(() => {
  switch (props.media.file?.source) {
    case 'ARIA2_DOWNLOAD':
      return '自动下载';
    case 'USER_UPLOAD':
      return '用户上传';
    case 'AUTO_GENERATED':
      return '自动生成';
    default:
      return '未知来源';
  }
});

const duration = ref(0);
const minutes = computed(() => {
  return Math.floor(duration.value / 60);
});
const seconds = computed(() => {
  return String(Math.floor(duration.value) % 60).padStart(2, '0');
});
onMounted(async () => {
  if (props.media.file?.id) {
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.autoplay = false;
    videoEl.onloadedmetadata = () => {
      duration.value = videoEl.duration;
      videoEl.remove();
    };
    videoEl.src = Api.File.buildDownloadPath(props.media.file.id);
  }
});

const emits = defineEmits(['click:content']);
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters class="pa-0">
      <v-col cols="4" class="d-flex align-center">
        <v-img
          class="rounded-lg clickable"
          cover
          :src="media.poster ? Api.File.buildRawPath(media.poster!.id) : MediaCoverFallback"
          :aspect-ratio="16 / 9"
          @click="(e) => emits('click:content', e)"
        >
        </v-img>
      </v-col>
      <v-col cols="8">
        <v-container fluid class="pa-0 ps-2 d-flex flex-column align-start justify-space-between h-100">
          <div class="d-flex flex-column">
            <span
              class="media-title font-weight-bold clickable"
              @click="(e) => emits('click:content', e)"
              :title="media.name"
            >
              {{ media.name }}
            </span>
            <div>
              <slot v-if="showChips" name="chips">
                <v-chip color="info" class="text-caption" size="x-small" label>
                  {{ sourceText }}
                </v-chip>
                <v-chip v-if="duration > 0" color="info" class="ml-1 text-caption" size="x-small" label>
                  {{ minutes }}:{{ seconds }}
                </v-chip>
                <v-chip v-if="media.subtitles?.length > 0" color="info" class="ml-1 text-caption" size="x-small" label>
                  外部字幕
                </v-chip>
              </slot>
            </div>
          </div>
          <div class="text-caption">
            <time-ago :time="media.createAt"></time-ago>
          </div>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">
.media-title
  display: -webkit-box
  overflow: hidden
  font-size: 0.9rem
  line-height: 1rem
  max-height: 2rem
  word-break: break-all
  text-overflow: ellipsis
  -webkit-box-orient: vertical
  -webkit-line-clamp: 2
  transition: color 0.5s

.media-title:hover
  color: rgb(var(--v-theme-primary))
</style>
