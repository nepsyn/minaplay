<template>
  <div>
    <span class="text-h5">{{ t('layout.sections') }}</span>
    <v-tabs class="mt-4 ms-1 border-s-sm" direction="vertical" density="comfortable" color="primary">
      <v-tab
        density="comfortable"
        v-for="(tab, index) in tabs"
        :key="index"
        :to="tab.to"
        replace
        :prepend-icon="tab.icon"
        :text="tab.text"
      ></v-tab>
    </v-tabs>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface NavTab {
  to: string;
  text: string;
  icon: string;
}

defineProps<{
  tabs: NavTab[];
}>();
</script>

<style scoped lang="sass"></style>
