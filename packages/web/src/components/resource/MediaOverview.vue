<script setup lang="ts">
import { MediaEntity } from '@/interfaces/media.interface';
import { Api } from '@/api/api';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import TimeAgo from '@/components/provider/TimeAgo.vue';
import { computed } from 'vue';

const props = defineProps<{
  media: MediaEntity;
}>();

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

const emits = defineEmits(['click:content']);
</script>

<template>
  <v-container v-bind="props" fluid class="pa-0 d-flex flex-column">
    <v-img
      :aspect-ratio="16 / 9"
      cover
      :src="media.poster ? Api.File.buildRawPath(media.poster!.id) : MediaCoverFallback"
      class="rounded-lg clickable"
      @click="(e) => emits('click:content', e)"
    >
      <template #placeholder>
        <v-img :src="MediaCoverFallback" cover></v-img>
      </template>
    </v-img>

    <span
      @click="(e) => emits('click:content', e)"
      class="mt-2 clickable media-title font-weight-bold"
      :title="media.name"
    >
      {{ media.name }}
    </span>

    <div class="mt-1 text-caption">
      <span>{{ sourceText }}</span>
      ·
      <time-ago :time="media.createAt"></time-ago>
    </div>
  </v-container>
</template>

<style scoped lang="sass">
.media-title
  display: -webkit-box
  overflow: hidden
  font-size: 1rem
  line-height: 1.5rem
  max-height: 3rem
  word-break: break-all
  text-overflow: ellipsis
  -webkit-box-orient: vertical
  -webkit-line-clamp: 2
  transition: color 0.5s

.media-title:hover
  color: rgb(var(--v-theme-primary))
</style>
