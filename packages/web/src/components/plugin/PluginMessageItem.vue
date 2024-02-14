<template>
  <template v-if="message.type === 'Text'">
    <pre class="text-subtitle-2 text-pre-wrap" :style="{ color: message.color }">{{ message.content }}</pre>
  </template>
  <template v-else-if="message.type === 'NetworkImage'">
    <zoom-img class="rounded" :src="message.url" eager max-width="60%"></zoom-img>
  </template>
  <template v-else-if="message.type === 'Base64Image'">
    <zoom-img class="rounded" :src="message.content" eager max-width="60%"></zoom-img>
  </template>
  <template v-else-if="message.type === 'Action'">
    <v-btn :color="message.text.color" variant="outlined" density="comfortable" @click="emits('action', message.value)">
      {{ message.text.content }}
    </v-btn>
  </template>
  <template v-else-if="message.type === 'Timeout'">
    <v-progress-circular color="primary" :model-value="(ttl / props.message.ms) * 100">
      {{ Math.round(ttl / 1000) }}
    </v-progress-circular>
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
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { MinaPlayMessage } from '@/api/interfaces/message.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { TimeoutError } from '@/composables/use-socket-io-connection';
import { usePluginConsoleStore } from '@/store/plugin-console';
import { useToastStore } from '@/store/toast';
import { useI18n } from 'vue-i18n';
import { onBeforeMount, onUnmounted, ref } from 'vue';
import { canRender } from '@/utils/utils';

const { t } = useI18n();
const pluginConsole = usePluginConsoleStore();
const toast = useToastStore();

const props = defineProps<{
  message: MinaPlayMessage;
}>();

const emits = defineEmits<{
  (ev: 'action', value: string): any;
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

const handleAction = async (value: string) => {
  if (props.message.type === 'ConsumableGroup') {
    await sendChat({
      type: 'ConsumableFeedback',
      id: props.message.id,
      value,
    });
  } else {
    emits('action', value);
  }
};

const { request: sendChat, onRejected: onChatSendFailed } = pluginConsole.sendTask;
onChatSendFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});
</script>

<style scoped lang="sass"></style>
