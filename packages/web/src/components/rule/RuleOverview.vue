<template>
  <v-card flat border class="d-flex flex-column">
    <v-card-title class="d-flex flex-row align-center">
      <span class="text-wrap text-break cursor-pointer" @click="router.push({ path: `/rule/${rule.id}` })">
        {{ rule.remark || t('rule.unnamed') }}
      </span>
      <v-spacer></v-spacer>
      <v-menu max-height="320" width="40%" :close-on-content-click="false">
        <v-card>
          <hightlightjs class="text-pre-wrap flex-grow-1" languaue="typescript" :code="rule.code"></hightlightjs>
        </v-card>
        <template #activator="{ props }">
          <v-btn variant="text" density="comfortable" :icon="mdiCodeBraces" v-bind="props"></v-btn>
        </template>
      </v-menu>
    </v-card-title>
    <v-card-subtitle class="pb-2">
      <span>{{ t('rule.entity.updateAt') }} {{ new Date(rule.updateAt).toLocaleString(locale) }}</span>
    </v-card-subtitle>
    <v-spacer></v-spacer>
    <v-divider></v-divider>
    <v-card-actions class="d-flex flex-row align-center py-2">
      <div v-if="!hideSources">
        <v-tooltip v-for="source in rule.sources ?? []" location="bottom" :key="source.id">
          {{ source.title || source.remark || t('source.unnamed') }}
          <br />
          {{ source.url }}
          <template #activator="{ props }">
            <v-icon class="mr-1" v-bind="props">
              <v-img cover :src="getFaviconUrl(source.url)" aspect-ratio="1">
                <template #placeholder>
                  <v-img :src="BlankFavicon" aspect-ratio="1"></v-img>
                </template>
              </v-img>
            </v-icon>
          </template>
        </v-tooltip>
      </div>
      <v-spacer></v-spacer>
      <v-menu>
        <v-card>
          <v-card-title>
            {{ t('app.actions.deleteTitle') }}
          </v-card-title>
          <v-card-text class="d-flex flex-column">
            <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.rule') }) }}</span>
            <span class="font-italic font-weight-bold">{{ rule.remark || t('rule.unnamed') }}</span>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary">
              {{ t('app.cancel') }}
            </v-btn>
            <v-btn variant="plain" color="error" :loading="ruleDeleting" @click="deleteRule()">
              {{ t('app.ok') }}
            </v-btn>
          </v-card-actions>
        </v-card>
        <template #activator="{ props }">
          <v-btn variant="plain" :icon="mdiDelete" color="error" density="comfortable" v-bind="props"></v-btn>
        </template>
      </v-menu>
      <v-btn variant="outlined" density="comfortable" @click="router.push({ path: `/rule/${rule.id}` })">
        {{ t('app.actions.edit') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { RuleEntity } from '@/api/interfaces/subscribe.interface';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin';
import BlankFavicon from '@/assets/blank-favicon.png';
import { mdiCodeBraces, mdiDelete } from '@mdi/js';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';

const hightlightjs = hljsVuePlugin.component;
const { t, locale } = useI18n();
const router = useRouter();
const api = useApiStore();
const toast = useToastStore();

const props = withDefaults(
  defineProps<{
    rule: RuleEntity;
    hideSources?: boolean;
  }>(),
  {
    hideSources: false,
  },
);

const emits = defineEmits<{
  (ev: 'deleted', rule: RuleEntity): any;
}>();

const {
  pending: ruleDeleting,
  request: deleteRule,
  onResolved: onRuleDeleted,
  onRejected: onRuleDeleteFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.delete(props.rule.id)();
});
onRuleDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  emits('deleted', props.rule);
});
onRuleDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return '://favicon.ico';
  }
};
</script>

<style scoped lang="sass"></style>
