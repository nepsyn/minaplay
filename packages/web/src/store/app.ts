import { defineStore } from 'pinia';
import { reactive, ref, Ref } from 'vue';
import { UserEntity } from '@/api/interfaces/user.interface';

export const useAppStore = defineStore('user', () => {
  const user: Ref<UserEntity | undefined> = ref(undefined);
  const setUser = (_user: UserEntity) => {
    user.value = _user;
  };

  const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
  });
  const toast = (message: string, color: 'error' | 'warning' | 'success' = 'success') => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
  };

  return {
    user,
    setUser,
    snackbar,
    toast,
  };
});
