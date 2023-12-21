<template>
  <to-top-container class="page-height overflow-auto d-none d-md-flex">
    <v-container fluid class="d-flex flex-column pa-md-12">
      <v-row>
        <v-col md="8">
          <v-container fluid class="pa-0 border rounded">
            <v-container class="d-flex flex-row">
              <template v-if="live">
                <user-avatar
                  size="64"
                  :src="live.user?.avatar && api.File.buildRawPath(live.user.avatar.id, live.user.avatar.name)"
                ></user-avatar>
                <v-container class="py-0 d-flex flex-column justify-space-around">
                  <span class="text-h6">{{ live.title ?? t('live.unnamed') }}</span>
                  <div class="text-subtitle-2 text-medium-emphasis">
                    <span>{{ live.user?.username ?? t('user.deleted') }}</span>
                    ·
                    <time-ago :time="live.createAt"></time-ago>
                  </div>
                </v-container>
              </template>
              <v-skeleton-loader v-else type="list-item-avatar-two-line" min-width="360px"></v-skeleton-loader>
            </v-container>
            <v-responsive :aspect-ratio="16 / 9" max-height="520" class="rounded-b">
              <video-player live></video-player>
            </v-responsive>
          </v-container>
        </v-col>
        <v-col md="4">
          <v-container class="pa-0 border rounded-lg h-100 d-flex flex-column">
            <div class="d-flex flex-column flex-grow-0">
              <v-tabs color="primary" grow v-model="tab" class="rounded-t-lg">
                <v-tab value="chat">{{ t('live.play.tabs.chat') }}</v-tab>
                <v-tab v-if="validated" value="audience">{{ t('live.play.tabs.audience') }}</v-tab>
                <v-tab v-if="validated" value="settings">{{ t('live.play.tabs.settings') }}</v-tab>
              </v-tabs>
              <v-divider></v-divider>
            </div>
            <v-fade-transition leave-absolute>
              <div class="d-flex flex-column flex-grow-1" v-if="tab === 'chat'">
                <v-container class="scrollable-container">
                  <v-row dense>
                    <v-col v-if="!validated" cols="12">
                      <v-alert type="warning" density="compact" variant="tonal">
                        <div class="d-flex flex-row align-center">
                          <span>{{ t('live.play.validateHint') }}</span>
                          <v-spacer></v-spacer>
                          <v-btn @click="validateDialog = true" class="ml-2" color="info" variant="outlined">
                            {{ t('live.play.validate') }}
                          </v-btn>
                        </div>
                      </v-alert>
                    </v-col>
                    <v-col v-for="(message, index) in events" :key="index" cols="12">
                      <live-message :event="message"></live-message>
                    </v-col>
                  </v-row>
                </v-container>
                <div class="d-flex flex-column flex-grow-0">
                  <v-divider></v-divider>
                  <v-container>
                    <v-text-field
                      density="compact"
                      hide-details
                      variant="outlined"
                      color="primary"
                      maxlength="20"
                      :placeholder="t('live.play.sendChat')"
                      :prepend-icon="mdiImagePlus"
                      :disabled="!validated || chatSending"
                      v-model.trim="chatText"
                      @keydown.enter="sendChat({ type: 'Text', content: chatText })"
                      @click:prepend="selectAndSendImage()"
                    >
                      <template #append-inner>
                        <v-btn
                          :loading="chatSending"
                          :disabled="!(chatText?.length > 0)"
                          variant="plain"
                          density="comfortable"
                          :icon="mdiNavigationVariant"
                          @click="sendChat({ type: 'Text', content: chatText })"
                        ></v-btn>
                      </template>
                    </v-text-field>
                  </v-container>
                </div>
              </div>
              <div class="d-flex flex-column flex-grow-1" v-else-if="tab === 'audience'">
                <v-container class="scrollable-container">
                  <p v-for="i in 120">{{ i }}</p>
                </v-container>
                <div class="d-flex flex-column flex-grow-0">
                  <v-divider></v-divider>
                  <v-container class="d-flex align-center">
                    <v-tooltip location="bottom">
                      {{ api.user?.username }}
                      <template #activator="{ props }">
                        <user-avatar
                          v-bind="props"
                          size="48"
                          :src="api.user?.avatar && api.File.buildRawPath(api.user.avatar.id, api.user.avatar.name)"
                        ></user-avatar>
                      </template>
                    </v-tooltip>
                    <v-btn
                      variant="flat"
                      class="text-medium-emphasis"
                      density="comfortable"
                      :icon="mdiMicrophone"
                    ></v-btn>
                  </v-container>
                </div>
              </div>
            </v-fade-transition>
          </v-container>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="validateDialog" max-width="480px" transition="dialog-bottom-transition">
      <v-card>
        <v-card-title>{{ t('live.play.validateTitle') }}</v-card-title>
        <v-card-text>
          <v-text-field
            variant="underlined"
            :label="t('live.play.password')"
            :prepend-icon="mdiLock"
            type="password"
            color="primary"
            clearable
            autofocus
            autocomplete="one-time-code"
            :error="validateError !== undefined"
            :error-messages="validateError"
            :loading="validating"
            v-model.trim="password"
            @keydown.enter="join()"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="router.push({ path: '/live' })" variant="plain">
            {{ t('live.play.exit') }}
          </v-btn>
          <v-btn color="primary" @click="join()" :loading="validating" :disabled="!(password.length > 0)">
            {{ t('live.play.validate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </to-top-container>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRoute, useRouter } from 'vue-router';
import VideoPlayer from '@/components/app/VideoPlayer.vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { computed, onUnmounted, ref } from 'vue';
import TimeAgo from '@/components/app/TimeAgo.vue';
import { mdiImagePlus, mdiLock, mdiMicrophone, mdiNavigationVariant } from '@mdi/js';
import { TimeoutError, useSocketIOConnection } from '@/composables/use-socket-io-connection';
import {
  LiveChatEntity,
  LiveChatNetworkImage,
  LiveChatText,
  LiveEvent,
  LiveEventMap,
  LiveState,
} from '@/api/interfaces/live.interface';
import LiveMessage from '@/components/live/LiveMessage.vue';
import { useToastStore } from '@/store/toast';
import { useAsyncTask } from '@/composables/use-async-task';
import { UserEntity } from '@/api/interfaces/user.interface';
import axios from 'axios';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const state = ref<LiveState | undefined>(undefined);
const live = computed(() => state.value?.live);

const { socket, request: emit } = useSocketIOConnection<LiveEventMap>(api.Live.socketPath, {
  extraHeaders: {
    Authorization: api.getToken() as string,
  },
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
});
onUnmounted(() => {
  socket.disconnect();
});
socket.on('connect', async () => {
  push({
    type: 'Notify',
    data: {
      action: 'connect',
    },
  });

  try {
    const live = await emit('info', { id: String(route.params.id) });
    state.value = { live, users: [], muted: { chat: [], voice: [] }, updateAt: new Date() };
    validateDialog.value = live.hasPassword;
    validated.value = !live.hasPassword;

    if (!live.hasPassword) {
      await join();
    }
  } catch (error: any) {
    toast.toastError(t(`error.${error?.code ?? 'other'}`));
  }
});
socket.on('disconnect', () => {
  push({
    type: 'Notify',
    data: {
      action: 'disconnect',
    },
  });
});
socket.on('member-join', (data: { user: UserEntity }) => {
  if (data.user.id !== api.user?.id) {
    push({
      type: 'Notify',
      data: {
        action: 'member-join',
        operator: data.user,
      },
    });
  }
  if (state.value) {
    state.value.users.push(data.user);
  }
});
socket.on('member-quit', (data: { user: UserEntity }) => {
  if (data.user.id !== api.user?.id) {
    push({
      type: 'Notify',
      data: {
        action: 'member-quit',
        operator: data.user,
      },
    });
  }

  if (state.value) {
    state.value.users = state.value.users.filter((user) => user.id !== data.user.id);
  }
});
socket.on('member-chat', (data: LiveChatEntity) => {
  push({
    type: 'Chat',
    data,
  });
});

const password = ref('');
const validated = ref(true);
const validateError = ref<string | undefined>(undefined);
const validateDialog = ref(false);
const {
  pending: validating,
  request: join,
  onResolved: onJoinCompleted,
  onRejected: onJoinFailed,
} = useAsyncTask(async () => {
  return await emit('join', {
    id: live.value?.id,
    password: password.value,
  });
});
onJoinCompleted(async (data) => {
  state.value = data;
  validated.value = true;
  validateDialog.value = false;

  // try get latest messages
  const start = new Date();
  start.setMinutes(start.getMinutes() - 30);
  try {
    const chats = await emit('messages', { start: start.toISOString() });
    for (const chat of chats) {
      push({
        type: 'Chat',
        data: chat,
      });
    }
  } catch (error: any) {
    toast.toastError(t(`error.${error?.code ?? 'other'}`));
  }
});
onJoinFailed((error) => {
  if (error instanceof TimeoutError) {
    validateError.value = t('error.timeout');
  } else {
    validateError.value = t(`error.${error.code}`);
  }
});

const chatText = ref('');
const {
  pending: chatSending,
  request: sendChat,
  onResolved: onChatSent,
  onRejected: onChatSendFailed,
} = useAsyncTask(async (message: LiveChatText | LiveChatNetworkImage) => {
  return await emit('chat', { message });
});
onChatSent(() => {
  chatText.value = '';
});
onChatSendFailed((error: any) => {
  toast.toastError(t(`error.${error?.code ?? 'other'}`));
});
const selectAndSendImage = () => {
  const el = document.createElement('input');
  el.accept = 'image/*';
  el.type = 'file';
  el.onchange = async (e) => {
    const file: File = (e.target as any).files[0];
    if (file) {
      chatSending.value = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort(new TimeoutError());
      }, 5000);
      try {
        const uploadFile = await api.File.uploadImage(file, undefined, controller.signal);
        await emit('chat', {
          message: {
            type: 'NetworkImage',
            url: api.File.buildRawPath(uploadFile.data.id, uploadFile.data.name),
          },
        });
      } catch (error: any) {
        if (error instanceof TimeoutError) {
          toast.toastError(t('error.timeout'));
        } else if (axios.isAxiosError(error)) {
          toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
        } else {
          toast.toastError(t(`error.${error?.code ?? 'other'}`));
        }
      } finally {
        clearTimeout(timeout);
        chatSending.value = false;
      }
    }
  };
  el.click();
};

const events = ref<LiveEvent[]>([]);
const push = (message: LiveEvent) => {
  if (events.value.length > 200) {
    events.value.shift();
  }
  events.value.push(message);
};

const tab = ref('chat');
</script>

<style scoped lang="sass"></style>
