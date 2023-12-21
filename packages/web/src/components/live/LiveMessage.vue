<template>
  <div class="d-flex flex-row">
    <template v-if="event.type === 'Notify'">
      <live-notify-message :notify="event"></live-notify-message>
    </template>
    <template v-else-if="event.type == 'Chat'">
      <live-chat-message :chat="event"></live-chat-message>
    </template>
  </div>
</template>

<script setup lang="ts">
import { LiveEvent } from '@/api/interfaces/live.interface';
import LiveChatMessage from '@/components/live/LiveChatMessage.vue';
import LiveNotifyMessage from '@/components/live/LiveNotifyMessage.vue';

defineProps<{
  event: LiveEvent;
}>();
</script>

<style scoped lang="sass"></style>
