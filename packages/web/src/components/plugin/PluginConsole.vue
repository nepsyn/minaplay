<template>
  <v-bottom-sheet :fullscreen="layout.pluginConsoleFullscreen" v-model="layout.pluginConsoleSheet" min-height="75vh">
    <v-layout>
      <v-system-bar>
        <v-icon :icon="mdiConsole" class="mr-2"></v-icon>
        <span>{{ t('plugin.console') }}</span>
        <v-spacer></v-spacer>
        <v-btn
          :icon="layout.pluginConsoleFullscreen ? mdiArrowCollapseDown : mdiArrowExpandUp"
          size="small"
          density="compact"
          variant="text"
          class="ml-2"
          @click="layout.pluginConsoleFullscreen = !layout.pluginConsoleFullscreen"
        ></v-btn>
        <v-btn
          :icon="mdiClose"
          size="small"
          density="compact"
          variant="text"
          class="ml-2"
          @click="layout.pluginConsoleSheet = false"
        ></v-btn>
      </v-system-bar>
      <v-main>
        <v-sheet height="100%">
          <v-container fluid class="h-100 d-flex flex-column pa-0">
            <template v-if="!pluginConsole.connected">
              <v-container fluid class="h-100 d-flex align-center justify-center">
                <template v-if="pluginConsole.connecting">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  <span class="text-subtitle-1 font-weight-bold ml-2">{{ t('plugin.initializing') }}</span>
                </template>
                <template v-else-if="pluginConsole.error">
                  <v-icon :icon="mdiCloseCircle"></v-icon>
                  <span class="text-subtitle-1 font-weight-bold ml-2">{{ t('plugin.connectFailed') }}</span>
                  <v-btn
                    variant="text"
                    color="primary"
                    class="text-subtitle-1 font-weight-bold ml-2"
                    @click="pluginConsole.connect()"
                  >
                    {{ t('app.actions.retry') }}
                  </v-btn>
                </template>
              </v-container>
            </template>
            <template v-else>
              <v-container fluid class="scrollable-container">
                <plugin-chat-message
                  v-for="(message, index) in pluginConsole.messages"
                  :message="message"
                  :key="index"
                ></plugin-chat-message>
              </v-container>
              <v-container fluid class="flex-grow-0 bg-transparent">
                <v-combobox
                  class="bg-transparent"
                  :items="programs"
                  item-title="program"
                  item-value="program"
                  :item-props="
                    (item) => ({
                      density: 'compact',
                      subtitle: item.description,
                    })
                  "
                  auto-select-first
                  autofocus
                  :return-object="false"
                  variant="outlined"
                  hide-details
                  density="compact"
                  :placeholder="t('plugin.sendChat')"
                  :prepend-inner-icon="mdiImage"
                  :append-inner-icon="mdiSendVariant"
                  :loading="chatSending"
                  @keydown.tab.prevent
                  @keydown.enter.prevent="text && sendChat({ type: 'Text', content: text })"
                  @click:append-inner="text && sendChat({ type: 'Text', content: text })"
                  v-model="text"
                >
                </v-combobox>
              </v-container>
            </template>
          </v-container>
        </v-sheet>
      </v-main>
    </v-layout>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  mdiArrowCollapseDown,
  mdiArrowExpandUp,
  mdiClose,
  mdiCloseCircle,
  mdiConsole,
  mdiImage,
  mdiSendVariant,
} from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { usePluginConsoleStore } from '@/store/plugin-console';
import { PluginCommandDescriptor } from '@/api/interfaces/plugin.interface';
import { useAsyncTask } from '@/composables/use-async-task';
import { TimeoutError } from '@/composables/use-socket-io-connection';
import { useToastStore } from '@/store/toast';
import PluginChatMessage from '@/components/plugin/PluginChatMessage.vue';
import { useLayoutStore } from '@/store/layout';

const { t } = useI18n();
const layout = useLayoutStore();
const pluginConsole = usePluginConsoleStore();
const toast = useToastStore();

const text = ref<string | undefined>(undefined);
const programs = ref<PluginCommandDescriptor[]>([]);

const {
  request: loadPrograms,
  onResolved: onProgramsLoaded,
  onRejected: onProgramsLoadFailed,
} = useAsyncTask(async () => {
  return await pluginConsole.client.request('commands');
});
onProgramsLoaded((data) => {
  programs.value = data;
});
onProgramsLoadFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});

const {
  pending: chatSending,
  request: sendChat,
  onResolved: onChatSent,
  onRejected: onChatSendFailed,
} = pluginConsole.sendTask;
onChatSent(() => {
  text.value = undefined;
});
onChatSendFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});

onMounted(async () => {
  if (!pluginConsole.connected) {
    pluginConsole.client.socket.once('connect', async () => {
      await loadPrograms();
      pluginConsole.messages.push({
        from: 'plugin',
        messages: [
          {
            type: 'Text',
            color: '#4671D5',
            content: t('plugin.welcome'),
          },
        ],
      });
    });
    pluginConsole.connect();
  } else {
    await loadPrograms();
  }
});
</script>

<style scoped lang="sass"></style>
