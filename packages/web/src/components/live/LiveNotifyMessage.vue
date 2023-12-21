<template>
  <v-alert v-if="getNotifyText(notify)" :type="notify.data.type ?? 'info'" density="compact" variant="tonal">
    <div v-if="['connect', 'disconnect'].includes(notify.data.action)">
      {{ getNotifyText(notify) }}
    </div>
    <div v-else-if="['member-join', 'member-quit'].includes(notify.data.action)">
      <span class="font-weight-bold">{{ notify.data.operator?.username }}</span>
      <span class="ml-1">{{ getNotifyText(notify) }}</span>
    </div>
  </v-alert>
</template>

<script setup lang="ts">
import { LiveNotify } from '@/api/interfaces/live.interface';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  notify: LiveNotify;
}>();

const getNotifyText = (notify: LiveNotify) => {
  switch (notify.data.action) {
    case 'connect':
      return t('live.play.notify.connect');
    case 'disconnect':
      return t('live.play.notify.disconnect');
    case 'member-join':
      return t('live.play.notify.memberJoin');
    case 'member-quit':
      return t('live.play.notify.memberQuit');
    default:
      return undefined;
  }
};
</script>

<style scoped lang="sass"></style>
