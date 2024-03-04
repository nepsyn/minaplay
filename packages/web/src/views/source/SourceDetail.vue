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
          <authed-router-view v-slot="{ Component }">
            <component
              :is="display.mdAndUp.value ? VScrollYReverseTransition : VScrollXReverseTransition"
              leave-absolute
            >
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </component>
          </authed-router-view>
        </div>
      </v-container>
    </to-top-container>
  </div>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import {
  mdiCodeBraces,
  mdiDownloadCircleOutline,
  mdiInformationOutline,
  mdiRss,
  mdiTimelineClockOutline,
} from '@mdi/js';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import NavSections from '@/components/app/NavSections.vue';
import NavTabs from '@/components/app/NavTabs.vue';
import { VScrollXReverseTransition, VScrollYReverseTransition } from 'vuetify/components/transitions';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';

const { t } = useI18n();
const route = useRoute();
const display = useDisplay();

const tabs = computed(() => [
  {
    to: `/source/${route.params.id}/info`,
    icon: mdiInformationOutline,
    text: t('source.sections.info'),
  },
  {
    to: `/source/${route.params.id}/raw`,
    icon: mdiRss,
    text: t('source.sections.raw'),
  },
  {
    to: `/source/${route.params.id}/log`,
    icon: mdiTimelineClockOutline,
    text: t('source.sections.log'),
  },
  {
    to: `/source/${route.params.id}/download`,
    icon: mdiDownloadCircleOutline,
    text: t('source.sections.download'),
  },
  {
    to: `/source/${route.params.id}/rule`,
    icon: mdiCodeBraces,
    text: t('source.sections.rule'),
  },
]);
</script>

<style scoped lang="sass"></style>
