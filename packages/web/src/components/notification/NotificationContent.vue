<template>
  <v-list-item slim lines="three">
    <template #prepend>
      <div class="px-3 text-h6">📣</div>
    </template>
    <v-list-item-title class="text-h6 text-wrap mb-1">
      {{ t(`notification.titles.${item.event}`) }}
    </v-list-item-title>
    <div class="text-caption font-weight-bold text-medium-emphasis">
      {{ new Date(item.data.time).toLocaleString(locale) }}
    </div>
    <template v-if="(item.event as any) === 'test'">
      <div class="text-disabled text-caption my-2">
        {{ (item.data as any).message }}
      </div>
    </template>
    <template v-if="[NotificationEventEnum.NEW_MEDIA, NotificationEventEnum.NEW_EPISODE].includes(item.event)">
      <div class="text-disabled text-caption my-2">
        {{
          t(
            `notification.descriptions.${item.event}`,
            item.event === NotificationEventEnum.NEW_MEDIA
              ? { name: item.data.media.name }
              : { series: item.data.episode.series.name, no: item.data.episode.no || item.data.episode.title },
          )
        }}
      </div>
      <v-chip
        label
        link
        border
        size="small"
        variant="text"
        @click="
          goto(
            item.event === NotificationEventEnum.NEW_MEDIA
              ? `/media/${item.data.media.id}`
              : `/episode/${item.data.episode.id}`,
          )
        "
      >
        <span>{{ t('app.actions.view') }}</span>
        <template #append>
          <v-icon class="ms-1" :icon="mdiOpenInNew" size="12"></v-icon>
        </template>
      </v-chip>
    </template>
    <template #append>
      <v-tooltip location="bottom">
        {{ item.read ? t('notification.markAsUnread') : t('notification.markAsRead') }}
        <template #activator="{ props }">
          <v-btn
            variant="text"
            size="small"
            v-bind="props"
            :icon="item.read ? mdiEmailVariant : mdiEmailOpenOutline"
            @click="emits('toggleRead')"
          ></v-btn>
        </template>
      </v-tooltip>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { NotificationItem } from '@/api/interfaces/notification.interface';
import { NotificationEventEnum } from '@/api/enums/notification-event.enum';
import { useI18n } from 'vue-i18n';
import { mdiEmailOpenOutline, mdiEmailVariant, mdiOpenInNew } from '@mdi/js';
import { useRouter } from 'vue-router';
import { useLayoutStore } from '@/store/layout';

const { t, locale } = useI18n();
const layout = useLayoutStore();
const router = useRouter();

defineProps<{
  item: NotificationItem;
}>();

const emits = defineEmits<{
  (ev: 'toggleRead'): any;
}>();

const goto = (path: string) => {
  router.push({ path });
  layout.notificationWindow = false;
};
</script>

<style scoped lang="sass"></style>
