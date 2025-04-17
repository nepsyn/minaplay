<template>
  <template v-if="message.type === 'Text'">
    <pre
      class="text-subtitle-2 text-pre-wrap message-container"
      :style="{ color: message.color }"
      v-text="message.content"
    ></pre>
  </template>
  <template v-else-if="message.type === 'NetworkImage'">
    <zoom-img class="rounded" :src="message.url" max-width="240">
      <template #placeholder>
        <v-img cover :src="ImagePlaceholder"></v-img>
      </template>
    </zoom-img>
  </template>
  <template v-else-if="message.type === 'Base64Image'">
    <zoom-img class="rounded" :src="message.content" max-width="240">
      <template #placeholder>
        <v-img cover :src="ImagePlaceholder"></v-img>
      </template>
    </zoom-img>
  </template>
  <template v-else-if="message.type === 'Action'">
    <v-btn :color="message.text.color" variant="outlined" density="comfortable" @click="sendAction?.(message.value)">
      {{ message.text.content }}
    </v-btn>
  </template>
  <template v-else-if="message.type === 'Timeout'">
    <v-progress-circular color="primary" :model-value="(ttl / (props.message as MinaPlayTimeout).ms) * 100">
      {{ Math.round(ttl / 1000) }}
    </v-progress-circular>
  </template>
  <template v-else-if="message.type === 'Pending'">
    <v-progress-circular :color="message.color" indeterminate></v-progress-circular>
  </template>
  <template v-else-if="message.type === 'ConsumableGroup'">
    <v-row dense class="align-center">
      <template v-for="(item, index) in message.items" :key="index">
        <v-col cols="auto" v-if="canRender(item)">
          <plugin-message-item :message="item"></plugin-message-item>
        </v-col>
      </template>
    </v-row>
  </template>
  <template v-else-if="message.type === 'ResourceSeries'">
    <v-row>
      <v-col cols="4" sm="3" md="2">
        <series-overview
          :series="message.series"
          @click="
            router.push({ path: `/series/${message.series.id}` });
            layout.pluginConsoleSheet = false;
          "
        ></series-overview>
      </v-col>
    </v-row>
  </template>
  <template v-else-if="message.type === 'ResourceMedia'">
    <v-row>
      <v-col cols="6" sm="4" md="3">
        <media-overview
          :media="message.media"
          @click="
            router.push({ path: `/media/${message.media.id}` });
            layout.pluginConsoleSheet = false;
          "
        ></media-overview>
      </v-col>
    </v-row>
  </template>
  <template v-else-if="message.type === 'MarkdownText'">
    <div class="text-subtitle-2 text-wrap message-container" v-html="markdown.render(message.content)"></div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { MinaPlayMessage, MinaPlayTimeout } from '@/api/interfaces/message.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { inject, onBeforeMount, onUnmounted, ref } from 'vue';
import { canRender } from '@/utils/utils';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useRouter } from 'vue-router';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import { useLayoutStore } from '@/store/layout';
import ImagePlaceholder from '@/assets/banner.jpeg';
// @ts-ignore
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const layout = useLayoutStore();
const router = useRouter();
const markdown = new MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }

    return '';
  },
});

const props = defineProps<{
  message: MinaPlayMessage;
}>();

const emits = defineEmits<{
  (ev: 'action', id: string | undefined, value: string): any;
  (ev: 'close-dialog'): any;
}>();

let interval: ReturnType<typeof setInterval> | undefined = undefined;
const ttl = ref(0);
onBeforeMount(() => {
  if (props.message.type === 'Timeout') {
    ttl.value = props.message.ms;
    interval = setInterval(() => {
      ttl.value -= 200;
      if (ttl.value <= 0) {
        clearInterval(interval);
      }
    }, 200);
  }
});
onUnmounted(() => {
  clearInterval(interval);
});

const sendAction = inject<Function>('send-action');
</script>

<style scoped lang="sass">
.message-container
  font-family: 'Maple', monospace
</style>
