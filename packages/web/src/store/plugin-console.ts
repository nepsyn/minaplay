import { defineStore } from 'pinia';
import { useSocketIOConnection } from '@/composables/use-socket-io-connection';
import { ref } from 'vue';
import { useApiStore } from '@/store/api';
import { MinaPlayPluginMessage, PluginControl, PluginEventMap } from '@/api/interfaces/plugin.interface';
import { MinaPlayMessage } from '@/api/interfaces/message.interface';
import { useAsyncTask } from '@/composables/use-async-task';

export const usePluginConsoleStore = defineStore('plugin-console', () => {
  const api = useApiStore();

  const messages = ref<MinaPlayPluginMessage[]>([]);
  const connecting = ref(false);
  const connected = ref(false);
  const error = ref<Error | undefined>(undefined);

  const client = useSocketIOConnection<PluginEventMap>(api.Plugin.socketPath, {
    extraHeaders: {
      Authorization: api.getToken() as string,
    },
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
    autoConnect: false,
  });
  client.socket.on('connect', () => {
    connected.value = true;
    connecting.value = false;
  });
  client.socket.on('disconnect', () => {
    connected.value = false;
    connecting.value = false;
  });
  client.socket.on('connect_error', (e: Error) => {
    error.value = e;
    connecting.value = false;
  });
  client.socket.on('console', (message: { plugin: PluginControl; messages: MinaPlayMessage[] }) => {
    messages.value.push({
      from: 'plugin',
      control: message.plugin,
      messages: message.messages,
    });
  });

  const connect = () => {
    error.value = undefined;
    connecting.value = true;
    client.socket.connect();
  };
  const sendTask = useAsyncTask(async (message: MinaPlayMessage) => {
    messages.value.push({
      from: 'user',
      messages: [message],
    });
    return await client.request('console', { message });
  });

  return {
    messages,
    connecting,
    connected,
    error,
    client,
    connect,
    sendTask,
  };
});
