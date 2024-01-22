<template>
  <div class="page-height d-flex flex-column">
    <nav-tabs class="d-flex d-md-none" :tabs="tabs"></nav-tabs>
    <to-top-container class="scrollable-container">
      <v-container class="py-md-12 h-100">
        <nav-sections
          :tabs="tabs"
          class="position-absolute d-none d-md-flex flex-column"
          style="width: 240px"
        ></nav-sections>
        <div :style="{ marginLeft: display.mdAndUp.value ? '300px' : '0' }" class="h-100 d-flex flex-column">
          <router-view v-slot="{ Component }">
            <component
              :is="display.mdAndUp.value ? VScrollYReverseTransition : VScrollXReverseTransition"
              leave-absolute
            >
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </component>
          </router-view>
        </div>
      </v-container>
    </to-top-container>
  </div>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import NavTabs from '@/components/app/NavTabs.vue';
import NavSections from '@/components/app/NavSections.vue';
import { VScrollXReverseTransition, VScrollYReverseTransition } from 'vuetify/components/transitions';
import { useDisplay } from 'vuetify';
import { computed } from 'vue';
import { mdiAccount, mdiCog } from '@mdi/js';

const { t } = useI18n();
const display = useDisplay();

const tabs = computed(() => [
  {
    to: '/setting/app',
    icon: mdiCog,
    text: t('settings.sections.app'),
  },
  {
    to: '/setting/profile',
    icon: mdiAccount,
    text: t('settings.sections.profile'),
  },
]);
</script>

<style scoped lang="sass"></style>
