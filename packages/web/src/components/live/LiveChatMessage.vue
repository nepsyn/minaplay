<template>
  <v-container fluid class="pa-0 d-flex flex-row align-start">
    <user-avatar
      v-bind="props"
      size="48"
      :src="user.avatar && api.File.buildRawPath(user.avatar.id, user.avatar.name)"
    ></user-avatar>
    <v-container fluid class="pa-0 d-flex flex-column justify-start">
      <v-container fluid class="px-5 py-0 d-flex align-center">
        <div class="grey--text message-caption flex-shrink-0">
          <span>{{ user.username }}</span>
          ·
          <time-ago :time="chat.data.createAt" interval="60000"></time-ago>
        </div>
        <v-container fluid class="pa-0 ml-1 d-flex align-center">
          <slot name="actions"></slot>
        </v-container>
      </v-container>
      <template v-if="message.type === 'Text'">
        <span class="plain-text ml-5 mr-2">{{ message.content }}</span>
      </template>
      <template v-else-if="message.type === 'NetworkImage'">
        <zoom-img
          class="ml-5 rounded chat-image"
          :src="message.url"
          eager
          max-width="200px"
          @load="emits('load')"
        ></zoom-img>
      </template>
      <template v-else>
        <span class="plain-text">{{ t('live.play.unknownChatType') }}</span>
      </template>
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/user/UserAvatar.vue';
import TimeAgo from '@/components/app/TimeAgo.vue';
import { LiveChat } from '@/api/interfaces/live.interface';
import { computed, onMounted } from 'vue';
import { useApiStore } from '@/store/api';
import { useI18n } from 'vue-i18n';
import ZoomImg from '@/components/app/ZoomImg.vue';

const { t } = useI18n();
const api = useApiStore();

const props = defineProps<{
  chat: LiveChat;
}>();

const emits = defineEmits(['load']);
onMounted(() => {
  if (message.value.type !== 'NetworkImage') {
    emits('load');
  }
});

const user = computed(() => props.chat.data.user);
const message = computed(() => props.chat.data.message);
</script>

<style scoped lang="sass">
.message-caption
  font-size: 0.875rem !important
  font-weight: 400

.plain-text
  font-size: 1rem !important
  font-weight: 400
  display: flex
  position: relative
  background-color: rgb(var(--v-theme-chat))
  border-radius: 4px
  padding: 8px 12px
  align-items: center
  word-break: break-all
  word-wrap: break-word

.plain-text:before
  content: ""
  position: absolute
  right: 100%
  top: 0
  width: 12px
  height: 16px
  border: 0 solid transparent
  border-bottom-width: 8px
  border-bottom-color: rgb(var(--v-theme-chat))
  border-radius: 0 0 0 32px
</style>
