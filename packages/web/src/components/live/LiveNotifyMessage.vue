<template>
  <v-alert :type="notify.data.type ?? 'info'" density="compact" variant="tonal">
    <div v-if="['member-join', 'member-quit'].includes(notify.data.action)">
      <span>
        <strong>{{ notify.data.user?.username }}</strong>
        {{ t(`live.play.notify.${notify.data.action}`) }}
      </span>
    </div>
    <div v-else>
      {{ t(`live.play.notify.${notify.data.action}`) }}
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
</script>

<style scoped lang="sass"></style>
