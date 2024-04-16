<template>
  <div class="page-height d-flex flex-column">
    <nav-tabs class="d-flex d-md-none" :tabs="tabs"></nav-tabs>
    <to-top-container class="scrollable-container">
      <v-container class="py-md-12 h-100">
        <router-view v-slot="{ Component }">
          <component :is="display.mdAndUp.value ? VScrollYReverseTransition : VScrollXReverseTransition" leave-absolute>
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </component>
        </router-view>
      </v-container>
    </to-top-container>
  </div>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import NavTabs from '@/components/app/NavTabs.vue';
import { VScrollXReverseTransition, VScrollYReverseTransition } from 'vuetify/components/transitions';
import { useDisplay } from 'vuetify';
import { computed } from 'vue';
import { mdiAccountCog, mdiCookieCog } from '@mdi/js';

const { t } = useI18n();
const display = useDisplay();

const tabs = computed(() => [
  {
    to: '/setting/app',
    icon: mdiCookieCog,
    text: t('settings.sections.app'),
  },
  {
    to: '/setting/profile',
    icon: mdiAccountCog,
    text: t('settings.sections.profile'),
  },
]);
</script>

<style scoped lang="sass"></style>
