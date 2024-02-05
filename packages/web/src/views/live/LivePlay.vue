<template>
  <to-top-container class="page-height overflow-auto overflow-x-hidden">
    <v-container fluid class="d-flex flex-column flex-md-row pa-0 pa-md-12 h-100">
      <v-container
        fluid
        class="pa-0 mx-md-2 d-flex flex-column"
        :class="display.mdAndUp.value ? 'border rounded v-col-8' : undefined"
      >
        <v-container class="d-none d-md-flex flex-row">
          <template v-if="live">
            <user-avatar
              size="64"
              :src="live.user?.avatar && api.File.buildRawPath(live.user.avatar.id, live.user.avatar.name)"
            ></user-avatar>
            <v-container class="py-0 d-flex flex-column justify-space-around">
              <div class="d-flex align-center">
                <span class="text-h6">{{ live.title ?? t('live.unnamed') }}</span>
                <v-icon class="ml-2 text-medium-emphasis" v-if="live.hasPassword" :icon="mdiLock" size="small"></v-icon>
              </div>
              <div class="text-subtitle-2 text-medium-emphasis">
                <span>{{ live.user?.username ?? t('user.deleted') }}</span>
                ·
                <time-ago :time="live.createAt" interval="60000"></time-ago>
              </div>
            </v-container>
          </template>
          <v-skeleton-loader v-else type="list-item-avatar-two-line" min-width="360px"></v-skeleton-loader>
          <div v-if="state" class="d-flex flex-row align-center flex-grow-0 ml-2">
            <v-icon :icon="mdiAccountMultiple"></v-icon>
            <span class="ml-2">{{ state.users.length }}</span>
          </div>
        </v-container>
        <v-divider class="py-0 d-flex d-md-none"></v-divider>
        <v-responsive class="pa-0 flex-grow-1" :class="display.mdAndUp.value ? 'rounded-b' : undefined">
          <video-player ref="playerRef" live :stream="state?.stream"></video-player>
        </v-responsive>
        <v-divider class="py-0 d-flex d-md-none"></v-divider>
      </v-container>
      <v-container
        class="pa-0 mx-md-2 h-100 d-flex flex-column"
        :class="display.mdAndUp.value ? 'border rounded-lg v-col-4' : undefined"
      >
        <div class="d-flex flex-column flex-grow-0">
          <v-tabs color="primary" grow v-model="tab" :class="display.mdAndUp.value ? 'rounded-t-lg' : undefined">
            <v-tab value="chat">{{ t('live.play.tabs.chat') }}</v-tab>
            <v-tab v-if="validated" value="voice">{{ t('live.play.tabs.voice') }}</v-tab>
            <v-tab v-if="validated && live?.user?.id === api.user?.id" value="settings">
              {{ t('live.play.tabs.settings') }}
            </v-tab>
          </v-tabs>
          <v-divider></v-divider>
        </div>
        <v-fade-transition leave-absolute>
          <div class="d-flex flex-column flex-grow-1" v-if="tab === 'chat'">
            <v-container class="scrollable-container" ref="eventContainerRef">
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
                  <live-message :event="message" @load="onMessageLoad"></live-message>
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
                  :disabled="!validated"
                  :loading="chatSending"
                  v-model.trim="chatText"
                  @keydown.enter="chatText?.length > 0 && sendChat({ type: 'Text', content: chatText })"
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
          <div class="d-flex flex-column flex-grow-1" v-else-if="tab === 'voice'">
            <v-container v-if="voiceMembers.length > 0" class="scrollable-container">
              <v-row dense>
                <v-col v-for="voice in voiceMembers" :key="voice.user.id" cols="12">
                  <v-container class="pa-0 d-flex flex-row align-center">
                    <user-avatar
                      :class="voice.level > 10 && voice.volume > 0 ? 'avatar-speaking' : undefined"
                      size="50"
                      :src="voice.user.avatar && api.File.buildRawPath(voice.user.avatar.id, voice.user.avatar.name)"
                    ></user-avatar>
                    <v-container class="pa-0 mx-4 d-flex flex-column justify-space-around">
                      <span class="px-2 text-body-1 text-medium-emphasis">
                        {{ voice.user.username }}
                      </span>
                      <v-slider
                        color="primary"
                        density="comfortable"
                        hide-details
                        min="0"
                        max="100"
                        thumb-label
                        step="0.1"
                        thumb-size="16"
                        v-model="voice.volume"
                        @update:model-value="voice.el.volume = voice.volume / 100"
                        :prepend-icon="voice.volume > 0 ? mdiVolumeHigh : mdiVolumeOff"
                        @click:prepend="
                          voice.volume = voice.volume > 0 ? 0 : 100;
                          voice.el.volume = voice.volume / 100;
                        "
                      ></v-slider>
                    </v-container>
                  </v-container>
                </v-col>
              </v-row>
            </v-container>
            <v-container v-else class="scrollable-container d-flex flex-column align-center justify-center">
              <v-icon :icon="mdiEmoticonCoolOutline" size="100"></v-icon>
              <span class="font-italic font-weight-bold mt-4 px-6">{{ t('live.play.voice.single') }}</span>
            </v-container>
            <div class="d-flex flex-column flex-grow-0">
              <v-divider></v-divider>
              <v-container class="d-flex align-center">
                <template v-if="producer && !producer.closed && !voiceConnecting">
                  <v-tooltip location="bottom">
                    {{ api.user?.username }}
                    <template #activator="{ props }">
                      <user-avatar
                        :class="selfSpeaking ? 'avatar-speaking' : undefined"
                        v-bind="props"
                        size="48"
                        :src="api.user?.avatar && api.File.buildRawPath(api.user.avatar.id, api.user.avatar.name)"
                      ></user-avatar>
                    </template>
                  </v-tooltip>
                  <v-tooltip location="bottom">
                    {{ producer?.paused ? t('live.play.voice.muted') : t('live.play.voice.speaking') }}
                    <template #activator="{ props }">
                      <v-btn
                        variant="flat"
                        class="ml-2 text-medium-emphasis"
                        density="comfortable"
                        :icon="producer.paused ? mdiMicrophoneOff : mdiMicrophone"
                        v-bind="props"
                        @click="producer.paused ? producer.resume() : producer.pause()"
                      ></v-btn>
                    </template>
                  </v-tooltip>

                  <v-spacer></v-spacer>
                  <v-btn
                    :loading="voiceConnecting"
                    variant="plain"
                    :prepend-icon="mdiPhoneOff"
                    color="error"
                    @click="disconnectVoice()"
                  >
                    {{ t('live.play.voice.quit') }}
                  </v-btn>
                </template>
                <template v-else>
                  <v-container class="pa-0 d-flex justify-center align-center">
                    <v-btn
                      :loading="voiceConnecting"
                      variant="tonal"
                      :prepend-icon="mdiPhone"
                      color="primary"
                      @click="connectVoice()"
                    >
                      {{ t('live.play.voice.join') }}
                    </v-btn>
                  </v-container>
                </template>
              </v-container>
            </div>
          </div>
          <div class="d-flex flex-column scrollable-container" v-else-if="tab === 'settings'">
            <v-list class="py-0">
              <component
                :is="display.smAndUp.value ? VMenu : VBottomSheet"
                :close-on-content-click="false"
                v-model="updateTitleMenu"
                @update:model-value="updateTitleMenu && (edit.title = live?.title)"
              >
                <v-card>
                  <v-card-text>
                    <v-list-subheader class="font-weight-bold">
                      {{ t('app.actions.edit') }}
                    </v-list-subheader>
                    <v-text-field
                      v-model.trim="edit.title"
                      autofocus
                      :label="t('live.entity.title')"
                      variant="outlined"
                      :append-icon="mdiCheck"
                      hide-details
                      maxlength="40"
                      density="compact"
                      :loading="liveUpdating"
                      @keydown.enter="edit.title && updateLive({ title: edit.title })"
                      @click:append="edit.title && updateLive({ title: edit.title })"
                    ></v-text-field>
                  </v-card-text>
                </v-card>
                <template #activator="{ props }">
                  <v-list-item link v-bind="props">
                    <template #prepend>
                      <span>{{ t('live.entity.title') }}</span>
                    </template>
                    <template #append>
                      <span class="text-medium-emphasis text-break text-wrap ml-4">
                        {{ live?.title ?? t('live.unnamed') }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </component>
              <v-divider></v-divider>
              <component
                :is="display.smAndUp.value ? VMenu : VBottomSheet"
                :close-on-content-click="false"
                v-model="updatePasswordMenu"
                @update:model-value="updatePasswordMenu && (edit.password = '')"
              >
                <v-card>
                  <v-card-text>
                    <v-list-subheader class="font-weight-bold">
                      {{ t('app.actions.edit') }}
                    </v-list-subheader>
                    <v-text-field
                      v-model.trim="edit.password"
                      autofocus
                      type="password"
                      :label="t('live.entity.password')"
                      variant="outlined"
                      autocomplete="one-time-code"
                      :append-icon="mdiCheck"
                      :rules="[(val) => val?.length == 0 || val?.length >= 4 || t('live.play.passwordLengthRule')]"
                      maxlength="40"
                      density="compact"
                      :loading="liveUpdating"
                      @keydown.enter="edit.password && updateLive({ password: edit.password })"
                      @click:append="edit.password && updateLive({ password: edit.password })"
                    ></v-text-field>
                    <template v-if="live?.hasPassword">
                      <v-list-subheader class="font-weight-bold">
                        {{ t('app.or') }}
                      </v-list-subheader>
                      <v-btn
                        variant="tonal"
                        color="warning"
                        :loading="liveUpdating"
                        :prepend-icon="mdiLockOpenVariant"
                        @click="updateLive({ password: null })"
                      >
                        {{ t('live.play.cancelPassword') }}
                      </v-btn>
                    </template>
                  </v-card-text>
                </v-card>
                <template #activator="{ props }">
                  <v-list-item link v-bind="props">
                    <template #prepend>
                      <span>{{ t('live.entity.password') }}</span>
                    </template>
                    <template #append>
                      <v-icon
                        class="text-medium-emphasis"
                        size="small"
                        :icon="live?.hasPassword ? mdiLock : mdiLockOff"
                      ></v-icon>
                    </template>
                  </v-list-item>
                </template>
              </component>
              <v-divider></v-divider>
              <v-list-item>
                <template #prepend>
                  <span>{{ t('live.entity.poster') }}</span>
                </template>
                <template #append>
                  <zoom-img
                    class="rounded"
                    min-width="120"
                    max-width="240"
                    :aspect-ratio="16 / 9"
                    :src="live?.poster ? api.File.buildRawPath(live.poster.id, live.poster.name) : LivePosterFallback"
                  >
                    <v-btn
                      class="position-absolute"
                      :loading="posterUploading"
                      style="bottom: 4px; right: 4px"
                      variant="tonal"
                      color="white"
                      :icon="mdiCloudUpload"
                      size="small"
                      density="comfortable"
                      @click.stop="selectAndUploadPoster()"
                    ></v-btn>
                  </zoom-img>
                </template>
              </v-list-item>
              <v-divider></v-divider>
              <component
                :is="display.smAndUp.value ? VMenu : VBottomSheet"
                :close-on-content-click="false"
                v-model="updateStreamMenu"
                @update:model-value="updateStreamMenu && (edit.stream = { ...state?.stream } as any)"
              >
                <v-card>
                  <v-card-text>
                    <v-list-subheader class="font-weight-bold">
                      {{ t('app.actions.edit') }}
                    </v-list-subheader>
                    <v-select
                      v-model.trim="edit.stream.type"
                      :label="t('live.play.stream.type')"
                      variant="outlined"
                      hide-details
                      density="compact"
                      :items="streamTypes"
                    >
                    </v-select>
                    <template v-if="edit.stream.type === 'server-push'">
                      <media-selector v-model="mediaSelectDialog" @selected="onStreamMediaSelected"></media-selector>
                      <series-selector v-model="seriesSelectDialog" @selected="onSeresSelected"></series-selector>
                      <v-row class="mt-2" dense>
                        <v-col cols="auto">
                          <v-btn
                            variant="tonal"
                            color="primary"
                            :prepend-icon="mdiMultimedia"
                            :loading="streamSwitching"
                            @click="mediaSelectDialog = true"
                          >
                            {{ t('app.actions.select') }} {{ t('app.entities.media') }}
                          </v-btn>
                        </v-col>
                        <v-col cols="auto">
                          <v-btn
                            class="ml-2"
                            variant="tonal"
                            color="primary"
                            :prepend-icon="mdiAnimationPlayOutline"
                            @click="seriesSelectDialog = true"
                          >
                            {{ t('app.actions.select') }} {{ t('app.entities.series') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </template>
                    <template v-else-if="edit.stream.type === 'live-stream'">
                      <v-text-field
                        class="mt-4"
                        v-model.trim="edit.stream.url"
                        autofocus
                        :label="t('live.play.stream.url')"
                        variant="outlined"
                        hide-details
                        density="compact"
                      ></v-text-field>
                      <div class="d-flex mt-4">
                        <v-spacer></v-spacer>
                        <v-btn
                          variant="text"
                          color="primary"
                          :disabled="!edit.stream.url"
                          :prepend-icon="mdiCheck"
                          :loading="streamSwitching"
                          @click="switchStream()"
                        >
                          {{ t('app.actions.save') }}
                        </v-btn>
                      </div>
                    </template>
                    <template v-if="state?.stream">
                      <v-list-subheader class="font-weight-bold">
                        {{ t('app.or') }}
                      </v-list-subheader>
                      <v-btn
                        variant="tonal"
                        color="warning"
                        :prepend-icon="mdiCancel"
                        :loading="streamStopping"
                        @click="stopStream()"
                      >
                        {{ t('live.play.stopStreaming') }}
                      </v-btn>
                    </template>
                  </v-card-text>
                </v-card>
                <template #activator="{ props }">
                  <v-list-item link v-bind="props">
                    <template #prepend>
                      <span>{{ t('live.entity.stream') }}</span>
                    </template>
                    <template #append>
                      <span class="text-medium-emphasis text-break text-wrap ml-4">
                        {{ state?.stream?.url || t('live.play.noStream') }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </component>
              <v-divider></v-divider>
              <v-container class="d-flex align-center justify-center">
                <v-menu>
                  <v-card>
                    <v-card-title>{{ t('live.play.closeTitle') }}</v-card-title>
                    <v-card-text>{{ t('live.play.closeConfirm') }}</v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="primary">{{ t('app.cancel') }}</v-btn>
                      <v-btn color="error" variant="plain" :loading="roomDisposing" @click="disposeRoom">
                        {{ t('app.ok') }}
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                  <template #activator="{ props }">
                    <v-btn variant="tonal" color="error" :prepend-icon="mdiClose" v-bind="props">
                      {{ t('app.actions.close') }} {{ t('app.entities.live') }}
                    </v-btn>
                  </template>
                </v-menu>
              </v-container>
            </v-list>
          </div>
        </v-fade-transition>
      </v-container>
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

    <v-dialog v-model="disposeDialog" max-width="480px" persistent>
      <v-card>
        <v-card-title>{{ t('live.play.disposeTitle') }}</v-card-title>
        <v-card-text>
          {{ t('live.play.disposeHint') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="router.replace({ path: '/live' })">
            {{ t('app.ok') }}
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
import { computed, nextTick, onUnmounted, ref, shallowRef } from 'vue';
import {
  mdiAccountMultiple,
  mdiAnimationPlayOutline,
  mdiCancel,
  mdiCheck,
  mdiClose,
  mdiCloudUpload,
  mdiEmoticonCoolOutline,
  mdiImagePlus,
  mdiLock,
  mdiLockOff,
  mdiLockOpenVariant,
  mdiMicrophone,
  mdiMicrophoneOff,
  mdiMultimedia,
  mdiNavigationVariant,
  mdiPhone,
  mdiPhoneOff,
  mdiVolumeHigh,
  mdiVolumeOff,
} from '@mdi/js';
import { TimeoutError, useSocketIOConnection } from '@/composables/use-socket-io-connection';
import {
  LiveChatEntity,
  LiveChatNetworkImage,
  LiveChatText,
  LiveDto,
  LiveEvent,
  LiveEventMap,
  LiveState,
  LiveStream,
  RoomVoice,
} from '@/api/interfaces/live.interface';
import { useToastStore } from '@/store/toast';
import { useAsyncTask } from '@/composables/use-async-task';
import { UserEntity } from '@/api/interfaces/user.interface';
import axios from 'axios';
import { Device } from 'mediasoup-client';
import { Transport } from 'mediasoup-client/lib/Transport';
import { Producer } from 'mediasoup-client/lib/Producer';
import { getFullUrl, selectFile } from '@/utils/utils';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { MediaEntity } from '@/api/interfaces/media.interface';
import { useDisplay } from 'vuetify';
import LivePosterFallback from '@/assets/live-poster-fallback.png';
import UserAvatar from '@/components/user/UserAvatar.vue';
import TimeAgo from '@/components/app/TimeAgo.vue';
import LiveMessage from '@/components/live/LiveMessage.vue';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { VBottomSheet, VMenu } from 'vuetify/components';
import MediaSelector from '@/components/resource/MediaSelector.vue';
import SeriesSelector from '@/components/resource/SeriesSelector.vue';
import { SeriesEntity } from '@/api/interfaces/series.interface';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useSettingsStore } from '@/store/settings';

const { t } = useI18n();
const { settings } = useSettingsStore();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const display = useDisplay();

const state = ref<LiveState | undefined>(undefined);
const live = computed(() => state.value?.live);
const playerRef = ref<InstanceType<typeof VideoPlayer> | undefined>(undefined);

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
    validateDialog.value = live.hasPassword && live.user?.id !== api.user?.id;
    validated.value = !validateDialog.value;

    if (validated.value) {
      await join();
    }
  } catch (error: any) {
    if (error?.code === ErrorCodeEnum.NOT_FOUND) {
      await router.replace({ path: '/error/not-found' });
    }

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
socket.on('stream', (data: { stream: LiveStream }) => {
  if (state.value) {
    state.value.stream = data.stream;
  }
});
socket.on('member-join', (data: { user: UserEntity }) => {
  if (data.user.id !== api.user?.id) {
    push({
      type: 'Notify',
      data: {
        action: 'member-join',
        user: data.user,
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
        user: data.user,
      },
    });
  }

  if (state.value) {
    state.value.users = state.value.users.filter((user) => user.id !== data.user.id);
  }
  voiceMembers.value = voiceMembers.value.filter((voice) => voice.user.id !== data.user.id);
});
socket.on('member-kick', async (data: { user: UserEntity }) => {
  if (data.user.id === api.user?.id) {
    toast.toastWarning(t('live.play.notify.member-kick'));
    await router.replace({ path: '/live' });
  }

  if (state.value) {
    state.value.users = state.value.users.filter((user) => user.id !== data.user.id);
  }
  voiceMembers.value = voiceMembers.value.filter((voice) => voice.user.id !== data.user.id);
});
socket.on('member-chat', (data: LiveChatEntity) => {
  push({
    type: 'Chat',
    data,
  });
  if (data.message.type === 'Text' && playerRef.value) {
    playerRef.value.emitDanmaku(data.message.content);
  }
});
socket.on('member-chat-revoke', (data: { id: string }) => {
  events.value = events.value.filter((event) => event.type === 'Notify' || event.data.id !== data.id);
});
socket.on('member-mute-chat', (data: { id: number }) => {
  if (state.value && !state.value.muted.chat.includes(data.id)) {
    state.value.muted.chat.push(data.id);
  }
  if (data.id === api.user?.id) {
    push({
      type: 'Notify',
      data: {
        action: 'member-mute-chat',
        user: api.user,
        type: 'warning',
      },
    });
  }
});
socket.on('member-unmute-chat', (data: { id: number }) => {
  if (state.value) {
    state.value.muted.chat = state.value.muted.chat.filter((id) => id !== data.id);
  }
});
socket.on('member-mute-voice', (data: { id: number }) => {
  if (state.value && !state.value.muted.voice.includes(data.id)) {
    state.value.muted.voice.push(data.id);
  }
  if (data.id === api.user?.id) {
    push({
      type: 'Notify',
      data: {
        action: 'member-mute-voice',
        user: api.user,
        type: 'warning',
      },
    });
  }
});
socket.on('member-unmute-voice', (data: { id: number }) => {
  if (state.value) {
    state.value.muted.voice = state.value.muted.voice.filter((id) => id !== data.id);
  }
});
const disposeDialog = ref(false);
socket.on('live-dispose', () => {
  disposeDialog.value = true;
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

  // auto join live voice
  if (settings.autoJoinVoice) {
    await connectVoice();
  }
});
onJoinFailed((error: any) => {
  validateError.value = t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`);
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
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});
const selectAndSendImage = () => {
  selectFile('image/*', false, async (files) => {
    const file = files[0];
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
            url: getFullUrl(api.File.buildRawPath(uploadFile.data.id, uploadFile.data.name)),
          },
        });
      } catch (error: any) {
        if (error instanceof TimeoutError) {
          toast.toastError(t(`error.${ErrorCodeEnum.TIMEOUT}`));
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
  });
};

const eventContainerRef = ref<{ $el: HTMLElement } | undefined>(undefined);
const events = ref<LiveEvent[]>([]);
const onMessageLoad = () => {
  nextTick(() => {
    if (eventContainerRef.value) {
      const el = eventContainerRef.value.$el;
      if (el.scrollTop === 0 || (el.scrollTop + el.clientHeight) / el.scrollHeight >= 0.95) {
        el.scrollTo({ top: el.scrollHeight });
      }
    }
  });
};
const push = (message: LiveEvent) => {
  if (events.value.length > 200) {
    events.value.shift();
  }
  events.value.push(message);
};

const device = new Device();
const voiceConnecting = ref(false);
let producerTransport = shallowRef<Transport | undefined>(undefined);
const consumerTransport = shallowRef<Transport | undefined>(undefined);
const producer = ref<Producer | undefined>(undefined);
const voiceMembers = ref<RoomVoice[]>([]);
const disconnectVoice = async () => {
  socket.off('voice-new-producer');
  socket.off('voice-closed-producer');

  if (consumerTransport.value && !consumerTransport.value.closed) {
    consumerTransport.value.close();
    consumerTransport.value = undefined;
  }
  if (producerTransport.value && !producerTransport.value.closed) {
    producerTransport.value.close();
    producerTransport.value = undefined;
  }
  if (producer.value && !producer.value.closed) {
    producer.value.close();
    producer.value = undefined;
  }

  for (const voice of voiceMembers.value) {
    voice.el.pause();
  }
  voiceMembers.value = [];
};
onUnmounted(() => {
  disconnectVoice();
});
const connectVoice = async () => {
  voiceConnecting.value = true;
  try {
    if (!device.loaded) {
      const cap = await emit('voice-rtp-capabilities');
      await device.load({ routerRtpCapabilities: cap });
    }

    // producer
    const producerTransportParams = await emit('voice-create-webrtc-transport');
    producerTransport.value = device.createSendTransport({
      ...producerTransportParams,
    });
    producerTransport.value.on('connect', async (data, callback) => {
      await emit('voice-connect-webrtc-transport', {
        transportId: producerTransportParams.id,
        dtlsParameters: data.dtlsParameters,
      });
      callback();
    });
    producerTransport.value.on('produce', async (data, callback) => {
      const resp = await emit('voice-create-producer', {
        transportId: producerTransport.value?.id,
        rtpParameters: data.rtpParameters,
      });
      callback({
        id: resp.producerId,
      });
    });
    producerTransport.value.on('connectionstatechange', (state) => {
      if (state === 'failed') {
        toast.toastError(t('live.play.voice.voiceConnectFailed'));
        disconnectVoice();
      }
    });

    // consumer
    const consumerTransportParams = await emit('voice-create-webrtc-transport');
    consumerTransport.value = device.createRecvTransport({
      ...consumerTransportParams,
    });
    consumerTransport.value.on('connect', async (data, callback) => {
      await emit('voice-connect-webrtc-transport', {
        transportId: consumerTransportParams.id,
        dtlsParameters: data.dtlsParameters,
      });
      callback();
    });
    consumerTransport.value.on('connectionstatechange', (state) => {
      if (state === 'failed') {
        toast.toastError(t('live.play.voice.voiceConnectFailed'));
        disconnectVoice();
      }
    });

    // current users
    const producers = await emit('voice-get-producers');
    for (const { userId, producerId } of producers) {
      await consume(userId, producerId);
    }

    // auto consume
    socket.on('voice-new-producer', async (data) => {
      await consume(data.userId, data.producerId);
    });

    // auto release
    socket.on('voice-closed-producer', async (data) => {
      voiceMembers.value = voiceMembers.value.filter((voice) => voice.user.id !== data.userId);
    });

    await produce();
  } catch (error: any) {
    if (error instanceof TimeoutError) {
      toast.toastError(t(`error.${ErrorCodeEnum.TIMEOUT}`));
    } else {
      toast.toastError(t(`error.${error?.code ?? 'other'}`));
    }
  } finally {
    voiceConnecting.value = false;
  }
};
const consume = async (userId: number, producerId: string) => {
  const user = state.value?.users.find((user) => user.id === userId);
  const member = voiceMembers.value.find((voice) => voice.user.id === userId);
  if (user && !member && userId !== api.user?.id) {
    const params = await emit('voice-create-consumer', {
      rtpCapabilities: device.rtpCapabilities,
      transportId: consumerTransport.value?.id,
      producerId: producerId,
    });
    const consumer = await consumerTransport.value?.consume({
      id: params.consumerId,
      producerId: params.producerId,
      kind: 'audio',
      rtpParameters: params.rtpParameters,
    });

    if (consumer) {
      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.volume = 1;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      let interval: any = undefined;
      audio.addEventListener('play', async () => {
        await audioCtx.resume();
        interval = setInterval(() => {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);
          control.value.level =
            dataArray.reduce(function (acc, value) {
              return acc + value;
            }, 0) / bufferLength;
        }, 100);
      });
      audio.addEventListener('pause', async () => {
        await audioCtx.suspend();
        clearInterval(interval);
      });

      const control = ref({
        user: state.value?.users.find((user) => user.id === userId) as UserEntity,
        el: audio,
        level: 0,
        volume: 100,
      });
      voiceMembers.value.push(control.value);
    }
  }
};
const selfSpeaking = ref(false);
const produce = async () => {
  if (device.canProduce('audio')) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const track = stream.getAudioTracks()[0];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      producer.value = await producerTransport.value?.produce({
        track,
      });

      let interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const level =
          dataArray.reduce(function (acc, value) {
            return acc + value;
          }, 0) / bufferLength;
        selfSpeaking.value = level > 10 && !producer.value?.paused;
      }, 100);
      producer.value?.on('transportclose', () => {
        clearInterval(interval);
      });
    } catch {
      await disconnectVoice();
      toast.toastError(t('live.play.voice.voiceConnectFailed'));
    }
  } else {
    await disconnectVoice();
    toast.toastError(t('live.play.voice.voiceNotEnabled'));
  }
};

const edit = ref<LiveDto & { stream: LiveStream }>({ stream: {} as any });
const updateTitleMenu = ref(false);
const updatePasswordMenu = ref(false);
const updateStreamMenu = ref(false);
const {
  pending: liveUpdating,
  request: updateLive,
  onResolved: onLiveUpdated,
  onRejected: onLiveUpdateFailed,
} = useAxiosRequest(async (data: LiveDto) => {
  return await api.Live.update(live.value!.id)(data);
});
onLiveUpdated((data) => {
  if (state.value) {
    state.value.live = data;
  }
  updateTitleMenu.value = false;
  updatePasswordMenu.value = false;
});
onLiveUpdateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
const posterUploading = ref(false);
const selectAndUploadPoster = async () => {
  selectFile('image/*', false, async (files) => {
    const file = files[0];
    if (file) {
      posterUploading.value = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort(new TimeoutError());
      }, 5000);
      try {
        const uploadFile = await api.File.uploadImage(file, undefined, controller.signal);
        const { data } = await api.Live.update(live.value!.id)({ posterFileId: uploadFile.data.id });
        state.value!.live = data;
      } catch (error: any) {
        if (error instanceof TimeoutError) {
          toast.toastError(t(`error.${ErrorCodeEnum.TIMEOUT}`));
        } else if (axios.isAxiosError(error)) {
          toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
        } else {
          toast.toastError(t(`error.${error?.code ?? 'other'}`));
        }
      } finally {
        posterUploading.value = false;
        clearTimeout(timeout);
      }
    }
  });
};

const mediaSelectDialog = ref(false);
const selectedMedia = ref<MediaEntity | undefined>(undefined);
const onStreamMediaSelected = async (media: MediaEntity) => {
  selectedMedia.value = media;
  await switchStream();
};
const seriesSelectDialog = ref(false);
const selectedSeries = ref<SeriesEntity | undefined>(undefined);
const onSeresSelected = async (series: SeriesEntity) => {
  selectedSeries.value = series;
};
const streamTypes = [
  { title: t('live.play.stream.serverPush'), value: 'server-push' },
  { title: t('live.play.stream.liveStream'), value: 'live-stream' },
];
const {
  pending: streamSwitching,
  request: switchStream,
  onResolved: onStreamSwitched,
  onRejected: onStreamSwitchFailed,
} = useAsyncTask(async () => {
  if (edit.value.stream.type === 'server-push') {
    return await emit('stream-server-push', { id: selectedMedia.value?.id });
  } else if (edit.value.stream.type === 'live-stream') {
    return await emit('stream-third-party', { url: edit.value.stream.url });
  }
});
onStreamSwitched((data) => {
  if (data && state.value) {
    state.value.stream = data;
  }
  updateStreamMenu.value = false;
});
onStreamSwitchFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});
const {
  pending: streamStopping,
  request: stopStream,
  onResolved: onStreamStopped,
  onRejected: onStreamStopFailed,
} = useAsyncTask(async () => {
  return await emit('stop-stream');
});
onStreamStopped(() => {
  if (state.value) {
    state.value.stream = undefined;
  }
  updateStreamMenu.value = false;
});
onStreamStopFailed((error: any) => {
  toast.toastError(t(`error.${error instanceof TimeoutError ? 'timeout' : error.code}`));
});

const {
  pending: roomDisposing,
  request: disposeRoom,
  onRejected: onRoomDisposeFailed,
} = useAxiosRequest(async () => {
  await disconnectVoice();
  return await api.Live.delete(String(route.params.id))();
});
onRoomDisposeFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const tab = ref('chat');
</script>

<style scoped lang="sass">
.avatar-speaking
  outline: 3px solid rgb(var(--v-theme-success-lighten-2))
  transition: outline-width 0.1s
</style>
