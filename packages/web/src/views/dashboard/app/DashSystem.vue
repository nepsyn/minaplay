<template>
  <v-container class="d-flex flex-column pa-md-12">
    <single-item-loader class="pa-0" :loader="statusLoader">
      <div class="d-flex align-center">
        <v-icon :icon="mdiChartDonut" size="large"></v-icon>
        <span class="ms-4 text-h5">{{ t('system.usage') }}</span>
      </div>
      <v-sheet class="border rounded-lg pa-4 my-4">
        <v-row class="pa-0">
          <v-col cols="12" sm="6">
            <v-sheet class="pa-4">
              <v-card-title class="text-center">
                {{ t('system.diskUsage') }}
                <span class="font-weight-bold text-secondary">({{ status!.disk.disk }})</span>
              </v-card-title>
              <div class="position-relative">
                <pie :options="pieOptions" :data="diskUsageData"></pie>
              </div>
            </v-sheet>
          </v-col>
          <v-col cols="12" sm="6">
            <v-sheet class="pa-4">
              <v-card-title class="text-center">{{ t('system.memoryUsage') }}</v-card-title>
              <div class="position-relative">
                <pie :options="pieOptions" :data="memoryUsageData"></pie>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-sheet>
      <v-row class="my-4">
        <v-col cols="12" sm="6">
          <div class="d-flex align-center">
            <v-icon :icon="mdiTimerOutline" size="large"></v-icon>
            <span class="ms-4 text-h5">{{ t('system.workingTime') }}</span>
          </div>
          <v-sheet class="border rounded-lg pa-4 my-4">
            <v-card-subtitle class="px-0">{{ t('system.startTime') }}</v-card-subtitle>
            <span class="text-h6">{{ new Date(status!.startAt).toLocaleString(locale) }}</span>
            <v-card-subtitle class="px-0 mt-2">{{ t('system.workedTime') }}</v-card-subtitle>
            <span class="text-h6">{{ workingTimeLabel }}</span>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="d-flex align-center">
            <v-icon :icon="mdiTagOutline" size="large"></v-icon>
            <span class="ms-4 text-h5">{{ t('system.version') }}</span>
          </div>
          <v-sheet class="border rounded-lg pa-4 my-4">
            <v-card-subtitle class="px-0">{{ t('system.webVersion') }}</v-card-subtitle>
            <span class="text-h6">{{ WEB_VERSION }}</span>
            <span class="text-caption font-italic ps-2">{{ BUILD_TIME }}</span>
            <v-card-subtitle class="px-0 mt-2">{{ t('system.serverVersion') }}</v-card-subtitle>
            <span class="text-h6">{{ status!.version }}</span>
            <single-item-loader class="pa-0 mt-2" :loader="versionUpdateLoader">
              <v-card-subtitle class="px-0">
                {{ t('system.latestServerVersion') }}
                <v-chip
                  v-if="versionUpdate?.current !== versionUpdate?.latest"
                  class="ms-2 text-caption"
                  color="error"
                  density="compact"
                >
                  {{ t('system.updateAvailable') }}
                </v-chip>
              </v-card-subtitle>
              <span class="text-h6">{{ versionUpdate?.latest }}</span>
              <template #loading>
                <div>
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
              </template>
            </single-item-loader>
          </v-sheet>
        </v-col>
      </v-row>
      <div class="d-flex align-center">
        <v-icon :icon="mdiInformationOutline" size="large"></v-icon>
        <span class="ms-4 text-h5">{{ t('system.about.title') }}</span>
      </div>
      <v-sheet class="border rounded-lg pa-4 my-4 d-flex flex-column">
        <span class="text-body-1">{{ t('system.about.description') }}</span>
        <v-row dense class="pa-0 my-2">
          <v-col cols="auto">
            <v-btn
              density="comfortable"
              variant="outlined"
              :prepend-icon="mdiLinkVariant"
              :text="t('system.about.doc')"
              target="_blank"
              href="https://nepsyn.github.io/minaplay/"
            ></v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              density="comfortable"
              variant="outlined"
              :prepend-icon="githubSvg"
              :text="t('system.about.github')"
              target="_blank"
              href="https://github.com/nepsyn/minaplay"
            ></v-btn>
          </v-col>
        </v-row>
        <span class="text-caption text-high-emphasis font-weight-bold">
          {{ t('system.about.license') }}
          ·
          {{ t('system.about.copyright') }}
        </span>
      </v-sheet>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { mdiChartDonut, mdiInformationOutline, mdiLinkVariant, mdiTagOutline, mdiTimerOutline } from '@mdi/js';
import { Pie } from 'vue-chartjs';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip, TooltipItem } from 'chart.js';
import { useLayoutStore } from '@/store/layout';

const WEB_VERSION = __VERSION;
const BUILD_TIME = __BUILD_TIME;

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const { t, locale } = useI18n();
const api = useApiStore();
const layout = useLayoutStore();

const statusLoader = useAxiosRequest(async () => {
  return await api.System.getStatus();
});
statusLoader.onResolved((status) => {
  workedSeconds.value = (Date.now() - new Date(status.startAt).getTime()) / 1000;
});
const { data: status } = statusLoader;

const versionUpdateLoader = useAxiosRequest(async () => {
  return await api.System.getUpdate();
});
const { data: versionUpdate } = versionUpdateLoader;

const pieOptions = computed<any>(() => ({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: layout.darkMode ? 'white' : ChartJS.defaults.color,
      },
    },
  },
}));
const diskUsageData = computed(() => {
  return {
    labels: [t('system.usageLabels.minaplay'), t('system.usageLabels.others'), t('system.usageLabels.free')],
    datasets: status.value
      ? [
          {
            data: [
              status.value.disk.used,
              status.value.disk.total - status.value.disk.free - status.value.disk.used,
              status.value.disk.free,
            ],
            backgroundColor: ['rgb(255, 99, 132)', 'rgb(255, 205, 86)', 'rgb(54, 162, 235)'],
            tooltip: {
              callbacks: {
                label: (item: TooltipItem<any>) => {
                  return `${((item.raw as number) / 1024 / 1024 / 1024).toFixed(2)} GB`;
                },
              },
            },
          },
        ]
      : [],
  };
});
const memoryUsageData = computed(() => {
  return {
    labels: [t('system.usageLabels.minaplay'), t('system.usageLabels.others'), t('system.usageLabels.free')],
    datasets: status.value
      ? [
          {
            data: [
              status.value.memory.used,
              status.value.memory.total - status.value.memory.free - status.value.memory.used,
              status.value.memory.free,
            ],
            backgroundColor: ['rgb(255, 99, 132)', 'rgb(255, 205, 86)', 'rgb(54, 162, 235)'],
            tooltip: {
              callbacks: {
                label: (item: TooltipItem<any>) => {
                  return `${((item.raw as number) / 1024 / 1024).toFixed(2)} MB`;
                },
              },
            },
          },
        ]
      : [],
  };
});

const workedSeconds = ref(0);
let interval: ReturnType<typeof setInterval> | undefined = undefined;
onMounted(() => {
  interval = setInterval(() => {
    if (status.value) {
      workedSeconds.value++;
    }
  }, 1000);
});
onUnmounted(() => {
  clearInterval(interval);
});
const workingTimeLabel = computed(() => {
  let totalSeconds = workedSeconds.value;
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${hours} : ${minutes} : ${seconds}`;
});

const githubSvg =
  'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z';
</script>

<style scoped lang="sass"></style>
