<template>
  <div class="d-flex flex-row align-center border-b">
    <v-tabs show-arrows color="primary">
      <v-tab
        v-for="(tab, index) in tabs"
        :key="index"
        :to="tab.to"
        replace
        :prepend-icon="tab.icon"
        :text="tab.text"
      ></v-tab>
    </v-tabs>
    <slot name="append"></slot>
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
