import { defineStore } from 'pinia';
import { reactive, ref, Ref } from 'vue';
import { UserEntity } from '@/api/interfaces/user.interface';

export const useApp = defineStore('user', () => {
  const user: Ref<UserEntity | undefined> = ref(undefined);
  const setUser = (_user: UserEntity) => {
    user.value = _user;
  };

  const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
  });
  const toast = (
    message: string,
    color: 'error' | 'warning' | 'success' | 'info' | 'primary' | 'secondary' = 'success',
  ) => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
  };

  const toastSuccess = (message: string) => toast(message, 'success');
  const toastWarning = (message: string) => toast(message, 'warning');
  const toastError = (message: string) => toast(message, 'error');
  const toastInfo = (message: string) => toast(message, 'info');

  return {
    user,
    setUser,
    snackbar,
    toast,
    toastSuccess,
    toastWarning,
    toastError,
    toastInfo,
  };
});
