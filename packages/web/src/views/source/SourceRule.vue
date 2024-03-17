<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('source.sections.rule') }}</span>
    <v-row class="py-2 mt-3" dense>
      <v-col cols="auto">
        <v-btn
          variant="flat"
          block
          color="success"
          height="40"
          :prepend-icon="mdiPlus"
          :loading="ruleCreating"
          @click="createRule()"
        >
          {{ t('app.actions.add') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn
          variant="flat"
          block
          color="info"
          height="40"
          :prepend-icon="mdiRefresh"
          :loading="rulesLoader.pending.value"
          @click="rulesLoader.reload()"
        >
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-2"></v-divider>
    <multi-items-loader class="px-0 py-3 mt-2" :loader="rulesLoader" auto>
      <v-row dense>
        <v-col v-for="item in rules" :key="item.id" cols="12" md="6">
          <rule-overview class="h-100" :rule="item" hide-sources @deleted="onItemDeleted"></rule-overview>
        </v-col>
      </v-row>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRoute, useRouter } from 'vue-router';
import { mdiPlus, mdiRefresh } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { RuleEntity, RuleQueryDto } from '@/api/interfaces/subscribe.interface';
import RuleOverview from '@/components/rule/RuleOverview.vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import DefaultTemplateCode from '@/api/templates/default.ts?raw';
import { useToastStore } from '@/store/toast';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const rulesLoader = useAxiosPageLoader(
  async (query: RuleQueryDto = {}) => {
    return await api.Rule.query({
      ...query,
      sourceId: Number(route.params.id),
      order: 'DESC',
    });
  },
  { page: 0, size: 20 },
);
const { items: rules } = rulesLoader;

const {
  pending: ruleCreating,
  request: createRule,
  onResolved: onRuleCreated,
  onRejected: onRuleCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.create({
    remark: t('rule.unnamed'),
    code: DefaultTemplateCode,
    sourceIds: [Number(route.params.id)],
  });
});
onRuleCreated(async (data) => {
  await router.push({ path: `/rule/${data.id}` });
});
onRuleCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const onItemDeleted = (rule: RuleEntity) => {
  rules.value = rules.value.filter(({ id }) => id !== rule.id);
};
</script>

<style scoped lang="sass"></style>
