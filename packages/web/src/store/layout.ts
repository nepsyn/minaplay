import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDisplay, useTheme } from 'vuetify';

export const useLayoutStore = defineStore('layout', () => {
  const display = useDisplay();
  const theme = useTheme();

  const navDrawer = ref(display.mdAndUp.value);
  const uploadDrawer = ref(false);

  const darkMode = computed(() => theme.global.current.value.dark);
  const toggleDarkMode = (darkMode: boolean) => {
    theme.global.name.value = darkMode ? 'dark' : 'light';
  };

  return {
    navDrawer,
    uploadDrawer,
    darkMode,
    toggleDarkMode,
  };
});
