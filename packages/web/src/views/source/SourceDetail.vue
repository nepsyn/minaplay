<template>
  <div class="page-height d-flex flex-column">
    <v-tabs class="d-flex d-md-none border-b-sm" show-arrows color="primary">
      <v-tab
        v-for="(tab, index) in tabs"
        :key="index"
        :to="tab.to"
        replace
        :prepend-icon="tab.icon"
        :text="tab.text"
      ></v-tab>
    </v-tabs>
    <to-top-container class="scrollable-container">
      <v-container class="py-md-12 h-100">
        <div class="position-absolute d-none d-md-flex flex-column" style="width: 240px">
          <span class="text-h5">{{ t('source.sections.title') }}</span>
          <v-tabs class="mt-4 ml-1 border-s-sm" direction="vertical" density="comfortable" color="primary">
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
        <div :style="{ marginLeft: display.mdAndUp.value ? '300px' : '0' }" class="h-100 d-flex flex-column">
          <router-view v-slot="{ Component }">
            <v-scroll-y-reverse-transition leave-absolute>
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </v-scroll-y-reverse-transition>
          </router-view>
        </div>
      </v-container>
    </to-top-container>
  </div>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { mdiDownloadCircleOutline, mdiInformationOutline, mdiRss, mdiTimelineClockOutline } from '@mdi/js';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

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
    to: `/source/${route.params.id}/downloads`,
    icon: mdiDownloadCircleOutline,
    text: t('source.sections.downloads'),
  },
]);
</script>

<style scoped lang="sass"></style>
