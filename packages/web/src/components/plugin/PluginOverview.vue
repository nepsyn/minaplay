<template>
  <v-card flat border class="d-flex flex-column">
    <v-card-title class="d-flex align-center">
      <v-avatar size="small" v-if="plugin.icon" class="mr-2">
        <v-img height="24" :src="plugin.icon"></v-img>
      </v-avatar>
      <span>{{ plugin.id }}</span>
      <v-spacer></v-spacer>
      <v-tooltip v-if="plugin.repo">
        {{ t('plugin.entity.repo') }}
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            density="comfortable"
            variant="text"
            :icon="mdiSourceRepository"
            :href="plugin.repo"
            @click.prevent="openUrl(plugin.repo)"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-card-title>
    <v-card-text>
      <span v-if="plugin.description">{{ plugin.description }}</span>
      <v-row dense class="mt-1">
        <v-col v-if="plugin.author === 'MinaPlay'" cols="auto">
          <v-chip label color="primary" density="comfortable">{{ t('plugin.official') }}</v-chip>
        </v-col>
        <v-col cols="auto" v-for="(program, index) in plugin.programs ?? []" :key="index">
          <v-chip label color="warning" density="comfortable">
            {{ t('plugin.program', { program }) }}
          </v-chip>
        </v-col>
        <v-col cols="auto" v-for="({ name, features }, index) in plugin.parsers ?? []" :key="index">
          <v-chip
            v-if="features?.getCalendar || features?.searchSeries"
            label
            color="secondary"
            density="comfortable"
            :to="`/parser/${plugin.id}/${name}`"
          >
            {{ t('plugin.parser', { parser: name }) }}
          </v-chip>
        </v-col>
      </v-row>
      <v-row class="mt-4">
        <v-col v-if="plugin.version" cols="auto" class="d-flex flex-row align-center text-subtitle-2">
          <v-tooltip location="bottom">
            {{ t('plugin.entity.version') }}
            <template #activator="{ props }">
              <v-icon v-bind="props" size="small" :icon="mdiTagOutline" class="mr-2"></v-icon>
            </template>
          </v-tooltip>
          {{ plugin.version }}
        </v-col>
        <v-col v-if="plugin.license" cols="auto" class="d-flex flex-row align-center text-subtitle-2">
          <v-tooltip location="bottom">
            {{ t('plugin.entity.license') }}
            <template #activator="{ props }">
              <v-icon v-bind="props" size="small" :icon="mdiScaleBalance" class="mr-2"></v-icon>
            </template>
          </v-tooltip>
          {{ plugin.license }}
        </v-col>
        <v-col v-if="plugin.author" cols="auto" class="d-flex flex-row align-center text-subtitle-2">
          <v-tooltip location="bottom">
            {{ t('plugin.entity.author') }}
            <template #activator="{ props }">
              <v-icon v-bind="props" size="small" :icon="mdiAccountOutline" class="mr-2"></v-icon>
            </template>
          </v-tooltip>
          {{ plugin.author }}
        </v-col>
      </v-row>
    </v-card-text>
    <template v-if="!hideActions">
      <v-divider></v-divider>
      <v-card-text class="d-flex flex-row align-center py-2">
        <v-tooltip>
          {{ plugin.enabled ? t('plugin.enabled') : t('plugin.disabled') }}
          <template #activator="{ props }">
            <v-icon v-bind="props" :icon="mdiCircle" :color="plugin.enabled ? 'success' : 'error'"></v-icon>
          </template>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-menu location="top center">
          <v-card>
            <v-card-title>{{ t('plugin.uninstallTitle') }}</v-card-title>
            <v-card-text>{{ t('plugin.uninstallHint') }}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary">{{ t('app.cancel') }}</v-btn>
              <v-btn variant="plain" color="error" @click="uninstall">{{ t('app.ok') }}</v-btn>
            </v-card-actions>
          </v-card>
          <template #activator="{ props }">
            <v-btn
              v-if="!plugin.isBuiltin"
              v-bind="props"
              density="comfortable"
              class="mr-1"
              variant="plain"
              :loading="uninstalling"
              color="error"
              :icon="mdiDelete"
            ></v-btn>
          </template>
        </v-menu>
        <v-btn
          variant="outlined"
          density="comfortable"
          :loading="enabledChanging"
          @click="changeEnabled(!plugin.enabled)"
        >
          {{ plugin.enabled ? t('plugin.disablePlugin') : t('plugin.enablePlugin') }}
        </v-btn>
      </v-card-text>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { PluginControl } from '@/api/interfaces/plugin.interface';
import { mdiAccountOutline, mdiCircle, mdiDelete, mdiScaleBalance, mdiSourceRepository, mdiTagOutline } from '@mdi/js';
import { openUrl } from '@/utils/utils';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { useAxiosRequest } from '@/composables/use-axios-request';

const { t } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const props = defineProps<{
  plugin: PluginControl;
  hideActions?: boolean;
}>();
const emits = defineEmits<{
  (ev: 'update', plugin: PluginControl): any;
  (ev: 'uninstall', plugins: PluginControl[]): any;
}>();

const {
  pending: uninstalling,
  request: uninstall,
  onResolved: onUninstalled,
  onRejected: onUninstallFailed,
} = useAxiosRequest(async () => {
  return await api.Plugin.uninstall(props.plugin.id)();
});
onUninstalled((data) => {
  toast.toastSuccess(t('plugin.uninstalled'));
  emits('uninstall', data);
});
onUninstallFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: enabledChanging,
  request: changeEnabled,
  onResolved: onEnabledChanged,
  onRejected: onEnabledChangeFailed,
} = useAxiosRequest(async (enabled: boolean) => {
  const handler = enabled ? api.Plugin.enable : api.Plugin.disable;
  return await handler(props.plugin.id)();
});
onEnabledChanged((data) => {
  emits('update', data);
});
onEnabledChangeFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
