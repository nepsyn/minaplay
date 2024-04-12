<template>
  <v-container class="d-flex flex-column pa-md-12">
    <single-item-loader class="pa-0" :loader="statusLoader">
      <div class="d-flex align-center">
        <v-icon :icon="mdiChartDonut" size="large"></v-icon>
        <span class="ml-4 text-h5">{{ t('system.usage') }}</span>
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
            <span class="ml-4 text-h5">{{ t('system.workingTime') }}</span>
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
            <span class="ml-4 text-h5">{{ t('system.version') }}</span>
          </div>
          <v-sheet class="border rounded-lg pa-4 my-4">
            <v-card-subtitle class="px-0">{{ t('system.currentVersion') }}</v-card-subtitle>
            <span class="text-h6">{{ status!.version }}</span>
            <single-item-loader class="pa-0 mt-2" :loader="versionUpdateLoader">
              <v-card-subtitle class="px-0">
                {{ t('system.latestVersion') }}
                <v-chip
                  v-if="versionUpdate?.current !== versionUpdate?.latest"
                  class="ml-2 text-caption"
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
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { mdiChartDonut, mdiTagOutline, mdiTimerOutline } from '@mdi/js';
import { Pie } from 'vue-chartjs';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip, TooltipItem } from 'chart.js';
import { useLayoutStore } from '@/store/layout';

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
</script>

<style scoped lang="sass"></style>
