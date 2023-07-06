import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { UserEntity } from '@/interfaces/user.interface';

export interface AppMessage {
  id: number;
  content: string;
  type: 'error' | 'warning' | 'success' | 'info';
  timeout: number;
}

export const useApp = defineStore('user', () => {
  const user: Ref<UserEntity | undefined> = ref(undefined);
  const setUser = (_user: UserEntity) => {
    user.value = _user;
  };

  const counter = (function* () {
    let counter = 0;
    while (true) {
      yield counter;
      counter = (counter + 1) % 1024;
    }
  })();
  const messages: Ref<AppMessage[]> = ref([]);
  const closeToast = (id: number) => {
    messages.value = messages.value.filter((v) => v.id !== id);
  };
  const toast = (
    content: string,
    type: 'error' | 'warning' | 'success' | 'info' = 'success',
    timeout: number = 5000,
  ) => {
    const message = {
      id: counter.next().value,
      content,
      type,
      timeout,
    };
    messages.value.push(message);
    if (timeout > 0) {
      setTimeout(() => {
        closeToast(message.id);
      }, message.timeout);
    }
  };

  const toastSuccess = (content: string) => toast(content, 'success');
  const toastWarning = (content: string) => toast(content, 'warning');
  const toastError = (content: string) => toast(content, 'error');
  const toastInfo = (content: string) => toast(content, 'info');

  return {
    user,
    setUser,
    messages,
    toast,
    closeToast,
    toastSuccess,
    toastWarning,
    toastError,
    toastInfo,
  };
});
