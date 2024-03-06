import { defineStore } from 'pinia';
import { useSocketIOConnection } from '@/composables/use-socket-io-connection';
import { PluginEventMap } from '@/api/interfaces/plugin.interface';
import { NotificationEventEnum } from '@/api/enums/notification-event.enum';
import { computed, Ref, ref } from 'vue';
import { NotificationItem } from '@/api/interfaces/notification.interface';
import { useApiStore } from '@/store/api';

export const useNotificationStore = defineStore('notification', () => {
  const api = useApiStore();

  const connected = ref(false);
  const connectError = ref<Error | undefined>(undefined);
  const notifications: Ref<NotificationItem[]> = ref([]);

  const read = computed(() => notifications.value.filter(({ read }) => read));
  const unread = computed(() => notifications.value.filter(({ read }) => !read));

  const { socket } = useSocketIOConnection<PluginEventMap>(api.Notification.socketPath, {
    extraHeaders: {
      Authorization: api.getToken() as string,
    },
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
  });
  socket.on('connect', () => {
    connected.value = true;
  });
  socket.on('disconnect', () => {
    connected.value = false;
  });
  socket.on('connect_error', (e: Error) => {
    connectError.value = e;
  });
  Object.values(NotificationEventEnum).forEach((event) => {
    socket.on(event, (data) => {
      notifications.value.unshift({
        event,
        data,
        read: false,
      });
    });
  });

  return {
    connected,
    connectError,
    read,
    unread,
    notifications,
    socket,
  };
});
