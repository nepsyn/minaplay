<template>
  <div class="d-flex flex-column mb-6">
    <div class="d-flex flex-row">
      <template v-if="message.from === 'plugin' && message.control">
        <v-avatar size="small" color="info">{{ message.control.id.slice(0, 2) }}</v-avatar>
        <span class="ml-4 text-subtitle-1 font-weight-bold">{{ message.control.id }}</span>
      </template>
      <template v-else-if="message.from === 'user' && api.user">
        <user-avatar
          :src="api.user.avatar && api.File.buildRawPath(api.user.avatar.id, api.user.avatar.name)"
          size="small"
        ></user-avatar>
        <span class="ml-4 text-subtitle-1 font-weight-bold">{{ api.user.username }}</span>
      </template>
    </div>
    <div class="ml-12 mb-1" v-for="item in message.messages">
      <template v-if="item.type === 'Text'">
        <pre class="text-subtitle-2 text-pre-wrap" :style="{ color: item.color }">{{ item.content }}</pre>
      </template>
      <template v-else-if="item.type === 'NetworkImage'">
        <zoom-img class="rounded" :src="item.url" eager max-width="60%"></zoom-img>
      </template>
      <template v-else-if="item.type === 'Base64Image'">
        <zoom-img class="rounded" :src="item.content" eager max-width="60%"></zoom-img>
      </template>
      <template v-else-if="item.type === 'ActionGroup'">
        <v-row dense>
          <v-col cols="auto" v-for="(option, index) in item.options" :key="index">
            <v-btn
              :color="option.text.color"
              variant="outlined"
              density="comfortable"
              :loading="chatSending"
              @click="sendFeedback(item, { type: 'Feedback', groupId: item.id, optionId: option.id })"
            >
              {{ option.text.content }}
            </v-btn>
          </v-col>
        </v-row>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinaPlayPluginMessage } from '@/api/interfaces/plugin.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useApiStore } from '@/store/api';
import { onMounted } from 'vue';
import { TimeoutError } from '@/composables/use-socket-io-connection';
import { usePluginConsoleStore } from '@/store/plugin-console';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toast';
import { MinaPlayActionGroup, MinaPlayFeedback } from '@/api/interfaces/message.interface';

const { t } = useI18n();
const api = useApiStore();
const pluginConsole = usePluginConsoleStore();
const toast = useToastStore();

const sendFeedback = async (group: MinaPlayActionGroup, feedback: MinaPlayFeedback) => {
  pluginConsole.messages.push({
    from: 'user',
    messages: [group.options.find((option) => option.id === feedback.optionId)!.text],
  });
  props.message.messages = props.message.messages.filter(
    (item) => !(item.type === 'ActionGroup' && item.id === feedback.groupId),
  );
  await sendChat(feedback);
};
const { pending: chatSending, request: sendChat, onRejected: onChatSendFailed } = pluginConsole.sendTask;
onChatSendFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});

const props = defineProps<{
  message: MinaPlayPluginMessage;
}>();

const emits = defineEmits(['load']);

onMounted(() => {
  emits('load');
});
</script>

<style scoped lang="sass"></style>
