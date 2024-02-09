import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AppMessage {
  id: number;
  content: string;
  type: 'error' | 'warning' | 'success' | 'info';
  timeout: number;
}

export const useToastStore = defineStore('toast', () => {
  let counter = 0;
  const messages = ref<AppMessage[]>([]);
  const closeToast = (id: number) => {
    messages.value = messages.value.filter((v) => v.id !== id);
  };
  const toast = (
    content: string,
    type: 'error' | 'warning' | 'success' | 'info' = 'success',
    timeout: number = 3000,
  ) => {
    const message = {
      id: counter++,
      content,
      type,
      timeout,
    };
    messages.value.push(message);
    if (timeout > 0) {
      setTimeout(() => {
        closeToast(message.id);
      }, timeout);
    }
  };
  const toastSuccess = (content: string, timeout?: number) => toast(content, 'success', timeout);
  const toastWarning = (content: string, timeout?: number) => toast(content, 'warning', timeout);
  const toastError = (content: string, timeout?: number) => toast(content, 'error', timeout);
  const toastInfo = (content: string, timeout?: number) => toast(content, 'info', timeout);

  return {
    messages,
    toast,
    closeToast,
    toastSuccess,
    toastWarning,
    toastError,
    toastInfo,
  };
});
