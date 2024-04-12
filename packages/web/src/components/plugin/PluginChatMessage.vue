<template>
  <div class="d-flex flex-column mb-6">
    <div class="d-flex flex-row">
      <template v-if="message.from === 'plugin' && message.control">
        <v-menu location="right" :close-on-content-click="false">
          <plugin-overview hide-actions :plugin="message.control"></plugin-overview>
          <template #activator="{ props }">
            <v-avatar
              class="cursor-pointer"
              v-bind="props"
              size="small"
              :color="message.control.icon ? undefined : getHashColor(message.control.id)"
            >
              <v-img height="24" v-if="message.control.icon" :src="message.control.icon"></v-img>
              <span v-else>{{ message.control.id.slice(0, 2) }}</span>
            </v-avatar>
          </template>
        </v-menu>

        <span class="ml-4 text-subtitle-1 font-weight-bold">{{ message.control.id }}</span>
      </template>
      <template v-else-if="message.from === 'user' && api.user">
        <user-avatar :src="api.user.avatar && api.File.buildRawPath(api.user.avatar)" size="small"></user-avatar>
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
import { md5 } from 'js-md5';
import PluginOverview from '@/components/plugin/PluginOverview.vue';

const api = useApiStore();

defineProps<{
  message: MinaPlayPluginMessage;
}>();

const getHashColor = (text: string) => {
  return `#${md5(text).slice(0, 6)}`;
};

const emits = defineEmits<{
  (ev: 'load'): any;
}>();

onMounted(() => {
  emits('load');
});
</script>

<style scoped lang="sass"></style>
