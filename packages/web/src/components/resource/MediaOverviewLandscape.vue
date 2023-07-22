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

const videoRef = ref<HTMLVideoElement>(null as any);
const handleHover = async (isHovering: boolean) => {
  if (isHovering && videoRef.value) {
    await videoRef.value.play();
  } else {
    await videoRef.value.pause();
    await videoRef.value.load();
  }
};

const duration = ref(0);
const minutes = computed(() => {
  return Math.floor(duration.value / 60);
});
const seconds = computed(() => {
  return Math.floor(duration.value) % 60;
});
onMounted(async () => {
  if (videoRef.value) {
    videoRef.value.onloadedmetadata = () => {
      duration.value = videoRef.value.duration;
    };
  }
});
</script>

<template>
  <v-container fluid class="pa-0 media-container">
    <v-row no-gutters class="pa-0">
      <v-col cols="4" class="d-flex align-center">
        <v-img
          class="poster"
          :src="media.poster ? Api.File.buildRawPath(media.poster!.id) : MediaCoverFallback"
          :aspect-ratio="16 / 9"
        >
        </v-img>
      </v-col>
      <v-col cols="8">
        <v-container fluid class="pa-0 pl-2 d-flex flex-column align-start justify-space-between fill-height">
          <div class="d-flex flex-column">
            <span class="media-title font-weight-bold" :title="media.name">{{ media.name }}</span>
            <div>
              <slot v-if="showChips" name="chips">
                <v-chip color="info" class="text-caption" size="x-small" style="cursor: pointer" label>
                  {{ sourceText }}
                </v-chip>
                <v-chip
                  v-if="duration > 0"
                  color="info"
                  class="ml-1 text-caption"
                  size="x-small"
                  style="cursor: pointer"
                  label
                >
                  {{ minutes }}:{{ seconds }}
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
.media-container
  cursor: pointer

.poster
  border-radius: 8px

.video-container
  height: 100%
  object-fit: cover

.media-title
  overflow: hidden
  font-size: 0.9rem
  line-height: 1rem
  max-height: 2rem
  word-break: break-all
  text-overflow: ellipsis
</style>
