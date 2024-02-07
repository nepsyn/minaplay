<template>
  <div class="d-flex flex-column mb-8" v-for="item in message.messages">
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
    <div class="ml-12">
      <template v-if="item.type === 'Text'">
        <pre class="text-subtitle-2" :style="{ color: item.color }">{{ item.content }}</pre>
      </template>
      <template v-else-if="item.type === 'NetworkImage'">
        <zoom-img class="rounded" :src="item.url" eager max-width="75%"></zoom-img>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinaPlayPluginMessage } from '@/api/interfaces/plugin.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useApiStore } from '@/store/api';

const api = useApiStore();

defineProps<{
  message: MinaPlayPluginMessage;
}>();
</script>

<style scoped lang="sass"></style>
