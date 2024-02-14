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
      <plugin-message-item v-if="canRender(item)" :message="item"></plugin-message-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinaPlayPluginMessage } from '@/api/interfaces/plugin.interface';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useApiStore } from '@/store/api';
import { onMounted } from 'vue';
import PluginMessageItem from '@/components/plugin/PluginMessageItem.vue';
import { canRender } from '@/utils/utils';

const api = useApiStore();

defineProps<{
  message: MinaPlayPluginMessage;
}>();

const emits = defineEmits(['load']);

onMounted(() => {
  emits('load');
});
</script>

<style scoped lang="sass"></style>
