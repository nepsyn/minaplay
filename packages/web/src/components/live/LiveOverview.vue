<template>
  <div class="d-flex flex-column cursor-pointer">
    <v-responsive :aspect-ratio="16 / 9">
      <v-overlay open-on-hover contained content-class="w-100 h-100" class="rounded-lg">
        <div class="d-flex justify-center align-center h-100 w-100">
          <v-icon :icon="mdiPlayCircle" color="white" size="48"></v-icon>
        </div>
        <template #activator="{ props }">
          <v-img
            :aspect-ratio="16 / 9"
            cover
            :src="live.poster ? api.File.buildRawPath(live.poster) : LivePosterFallback"
            class="rounded-lg"
            v-bind="props"
          >
            <template #placeholder>
              <v-img :src="LivePosterFallback" cover></v-img>
            </template>
          </v-img>
        </template>
      </v-overlay>
    </v-responsive>

    <div class="d-flex flex-row mt-1 align-center">
      <user-avatar size="40" :src="live?.user?.avatar && api.File.buildRawPath(live.user.avatar)"></user-avatar>
      <div class="d-flex flex-column px-1 ms-2 justify-space-around">
        <div class="mt-2 d-flex flex-row align-center font-weight-bold live-title">
          <span class="live-title">{{ live.title || t('live.unnamed') }}</span>
          <v-icon class="ms-1 text-medium-emphasis" v-if="live.hasPassword" :icon="mdiLock" size="x-small"></v-icon>
        </div>
        <span class="text-caption text-medium-emphasis">{{ live.user?.username || t('user.deleted') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LiveEntity } from '@/api/interfaces/live.interface';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useApiStore } from '@/store/api';
import { useI18n } from 'vue-i18n';
import { mdiLock, mdiPlayCircle } from '@mdi/js';
import LivePosterFallback from '@/assets/live-poster-fallback.png';

const { t } = useI18n();
const api = useApiStore();

defineProps<{
  live: LiveEntity;
}>();
</script>

<style scoped lang="sass">
.live-title
  display: -webkit-box
  overflow: hidden
  font-size: 1rem
  line-height: 1.2rem
  max-height: 2.4rem
  word-break: break-all
  text-overflow: ellipsis
  -webkit-box-orient: vertical
  -webkit-line-clamp: 2
  transition: color 0.5s

.live-title:hover
  color: rgb(var(--v-theme-primary))
</style>
