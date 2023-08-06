import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { UserEntity } from '@/interfaces/user.interface';
import { PermissionEnum } from '@/api/enums/permission.enum';

export interface AppMessage {
  id: number;
  content: string;
  type: 'error' | 'warning' | 'success' | 'info';
  timeout: number;
}

export const useApp = defineStore('user', () => {
  const user: Ref<UserEntity | undefined> = ref(undefined);
  const setUser = (_user: UserEntity | undefined) => {
    user.value = _user;
    if (_user == null) {
      localStorage.removeItem('minaplay-user');
    } else {
      localStorage.setItem('minaplay-user', String(_user.id));
    }
  };
  const hasPermission = (...permissions: PermissionEnum[]) => {
    return user.value && permissions.some((name) => user.value?.permissionNames.includes(name));
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
    timeout: number = 3000,
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
  const toastSuccess = (content: string, timeout?: number) => toast(content, 'success', timeout);
  const toastWarning = (content: string, timeout?: number) => toast(content, 'warning', timeout);
  const toastError = (content: string, timeout?: number) => toast(content, 'error', timeout);
  const toastInfo = (content: string, timeout?: number) => toast(content, 'info', timeout);

  const uploadDrawer = ref(false);
  const uploadFiles: Ref<File[]> = ref([]);

  const darkMode = ref(false);

  const copyContent = async (url: string, successText?: string, errorText?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess(successText ?? '已复制到剪切板');
    } catch {
      toastError(errorText ?? '复制失败');
    }
  };

  const selectFile = (accept: string, onSelected: (file: File) => any) => {
    const el = document.createElement('input');
    el.accept = accept;
    el.type = 'file';
    el.onchange = async (e) => {
      const file = (e.target as any).files?.[0];
      if (file) {
        await onSelected(file);
      }
    };
    el.click();
  };

  return {
    user,
    setUser,
    hasPermission,
    messages,
    toast,
    closeToast,
    toastSuccess,
    toastWarning,
    toastError,
    toastInfo,
    uploadDrawer,
    uploadFiles,
    darkMode,
    copyContent,
    selectFile,
  };
});
