<template>
  <v-dialog
    v-model="layout.notificationWindow"
    :class="display.smAndUp.value ? 'w-50' : 'w-100'"
    :fullscreen="!display.smAndUp.value"
    min-height="75vh"
  >
    <v-card min-height="inherit" height="100%">
      <v-card-item>
        <template #prepend>
          <v-icon :icon="mdiBell" size="large"></v-icon>
        </template>
        <v-card-title>{{ t('layout.user.notification.title') }}</v-card-title>
        <template #append>
          <v-btn
            variant="text"
            density="comfortable"
            :icon="mdiClose"
            @click="layout.notificationWindow = false"
          ></v-btn>
        </template>
      </v-card-item>
      <v-divider class="mt-4"></v-divider>
      <v-layout>
        <v-navigation-drawer v-if="display.smAndUp.value" permanent>
          <v-list density="compact" nav>
            <v-list-item
              v-for="item in tabs"
              :key="item.value"
              :active="tab === item.value"
              :prepend-icon="item.icon"
              @click="tab = item.value"
            >
              {{ item.text }}
              <template #append>
                <span class="text-caption" v-if="item.notifications.value.length > 0">{{
                  item.notifications.value.length
                }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
        <v-bottom-navigation v-else v-model="tab" grow density="comfortable">
          <v-btn v-for="item in tabs" :key="item.value" :value="item.value">
            <v-icon :icon="item.icon"></v-icon>
            <span class="mt-1">{{ item.text }}</span>
          </v-btn>
        </v-bottom-navigation>
        <v-main scrollable>
          <v-window v-model="tab">
            <v-window-item v-for="item in tabs" :key="item.value" :value="item.value">
              <v-container
                v-if="item.notifications.value.length === 0"
                class="pt-16 d-flex flex-column align-center justify-center"
              >
                <v-icon class="text-medium-emphasis" :icon="mdiMailboxOpenOutline" size="240"></v-icon>
                <span class="text-subtitle-1 font-weight-bold text-medium-emphasis">{{ t('app.loader.empty') }}</span>
              </v-container>
              <v-list v-else class="py-0">
                <template v-for="(notificationItem, index) in item.notifications.value" :key="index">
                  <notification-content
                    class="py-4"
                    :item="notificationItem"
                    @toggle-read="notificationItem.read = !notificationItem.read"
                  ></notification-content>
                  <v-divider></v-divider>
                </template>
              </v-list>
            </v-window-item>
          </v-window>
        </v-main>
      </v-layout>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useLayoutStore } from '@/store/layout';
import { useDisplay } from 'vuetify';
import {
  mdiBell,
  mdiClose,
  mdiEmailMultipleOutline,
  mdiEmailOpenMultipleOutline,
  mdiMailboxOpenOutline,
} from '@mdi/js';
import { computed, ref } from 'vue';
import { useNotificationStore } from '@/store/notification';
import NotificationContent from '@/components/notification/NotificationContent.vue';

const { t, locale } = useI18n();
const layout = useLayoutStore();
const display = useDisplay();
const notification = useNotificationStore();

const tab = ref('unread');
const tabs = [
  {
    value: 'unread',
    text: t('layout.user.notification.unread'),
    icon: mdiEmailMultipleOutline,
    notifications: computed(() => notification.unread),
  },
  {
    value: 'read',
    text: t('layout.user.notification.read'),
    icon: mdiEmailOpenMultipleOutline,
    notifications: computed(() => notification.read),
  },
];
</script>

<style scoped lang="sass"></style>
