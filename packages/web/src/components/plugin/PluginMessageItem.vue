<template>
  <template v-if="message.type === 'Text'">
    <pre class="text-subtitle-2 text-pre-wrap" :style="{ color: message.color }">{{ message.content }}</pre>
  </template>
  <template v-else-if="message.type === 'NetworkImage'">
    <zoom-img class="rounded" :src="message.url" eager max-width="240">
      <template #placeholder>
        <v-skeleton-loader height="100%" type="image"></v-skeleton-loader>
      </template>
    </zoom-img>
  </template>
  <template v-else-if="message.type === 'Base64Image'">
    <zoom-img class="rounded" :src="message.content" eager max-width="240">
      <template #placeholder>
        <v-skeleton-loader height="100%" type="image"></v-skeleton-loader>
      </template>
    </zoom-img>
  </template>
  <template v-else-if="message.type === 'Action'">
    <v-btn
      :color="message.text.color"
      variant="outlined"
      density="comfortable"
      @click="emits('action', undefined, message.value)"
    >
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
          <plugin-message-item :message="item" @action="handleAction"></plugin-message-item>
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
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { MinaPlayMessage, MinaPlayTimeout } from '@/api/interfaces/message.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { onBeforeMount, onUnmounted, ref } from 'vue';
import { canRender } from '@/utils/utils';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';
import { useRouter } from 'vue-router';
import MediaOverview from '@/components/resource/MediaOverview.vue';
import { useLayoutStore } from '@/store/layout';

const layout = useLayoutStore();
const router = useRouter();

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

const handleAction = async (id: string | undefined, value: string) => {
  if (!id && props.message.type === 'ConsumableGroup') {
    emits('action', props.message.id, value);
  } else {
    emits('action', id, value);
  }
};
</script>

<style scoped lang="sass"></style>
