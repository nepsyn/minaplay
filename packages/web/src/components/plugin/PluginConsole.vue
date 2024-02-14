<template>
  <v-bottom-sheet
    :close-on-back="false"
    :fullscreen="layout.pluginConsoleFullscreen"
    v-model="layout.pluginConsoleSheet"
    min-height="75vh"
  >
    <v-layout>
      <v-system-bar>
        <v-icon :icon="mdiConsole" class="mr-2"></v-icon>
        <span>{{ t('plugin.console') }}</span>
        <v-spacer></v-spacer>
        <v-btn
          :icon="mdiDeleteOutline"
          size="small"
          density="compact"
          variant="text"
          @click="pluginConsole.messages = pluginConsole.messages.slice(0, 1)"
        ></v-btn>
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
              <v-container fluid class="scrollable-container" ref="messageContainerRef" v-mutate.child="scrollToBottom">
                <v-container class="d-block py-0">
                  <v-slide-x-reverse-transition group>
                    <template v-for="(message, index) in pluginConsole.messages" :key="index">
                      <plugin-chat-message
                        v-if="message.messages.filter(canRender).length > 0"
                        :message="message"
                      ></plugin-chat-message>
                    </template>
                  </v-slide-x-reverse-transition>
                  <div v-intersect="(isIntersecting: boolean) => (atBottom = isIntersecting)"></div>
                </v-container>
                <v-container class="position-sticky d-flex justify-center" style="bottom: 0">
                  <v-btn
                    :icon="mdiArrowDown"
                    variant="elevated"
                    size="small"
                    v-if="!atBottom"
                    elevation="4"
                    @click="scrollToBottom"
                  ></v-btn>
                </v-container>
              </v-container>
              <v-container class="flex-grow-0 bg-transparent">
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
                  :menu-props="!command ? { modelValue: false } : {}"
                  autofocus
                  :return-object="false"
                  variant="outlined"
                  hide-details
                  density="compact"
                  :placeholder="t('plugin.sendChat')"
                  :append-inner-icon="mdiSendVariant"
                  :loading="chatSending"
                  @keydown.tab.prevent
                  @keydown.enter.prevent="command && sendChat({ type: 'Text', content: command })"
                  @click:append-inner="command && sendChat({ type: 'Text', content: command })"
                  v-model="command"
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
import { onMounted, onUpdated, ref } from 'vue';
import {
  mdiArrowCollapseDown,
  mdiArrowDown,
  mdiArrowExpandUp,
  mdiClose,
  mdiCloseCircle,
  mdiConsole,
  mdiDeleteOutline,
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
import { canRender } from '@/utils/utils';

const { t } = useI18n();
const layout = useLayoutStore();
const pluginConsole = usePluginConsoleStore();
const toast = useToastStore();

const command = ref<string | undefined>(undefined);
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
onUpdated(async () => {
  await loadPrograms();
});

const {
  pending: chatSending,
  request: sendChat,
  onResolved: onChatSent,
  onRejected: onChatSendFailed,
} = pluginConsole.sendTask;
onChatSent(() => {
  command.value = undefined;
  scrollToBottom();
});
onChatSendFailed((error: any) => {
  command.value = undefined;
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});

const atBottom = ref(false);
const messageContainerRef = ref<{ $el: HTMLElement } | undefined>(undefined);
const scrollToBottom = () => {
  setTimeout(() => {
    if (messageContainerRef.value) {
      const el = messageContainerRef.value.$el;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, 50);
};
onUpdated(() => {
  scrollToBottom();
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
            color: '#0288d1',
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
