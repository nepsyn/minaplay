<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <span class="text-h4">{{ t('rule.title') }}</span>
      <v-row class="mt-3" dense>
        <v-col cols="12" sm="auto" class="flex-grow-1">
          <v-text-field
            variant="outlined"
            density="compact"
            color="primary"
            :prepend-inner-icon="mdiMagnify"
            hide-details
            :label="t('app.input.keyword')"
            :placeholder="t('app.input.placeholder', { item: t('app.entities.rule') })"
            clearable
            v-model.trim="filters.keyword"
            @update:model-value="useQuery"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-select
            variant="outlined"
            :label="t('app.input.order')"
            density="compact"
            v-model="filters.order"
            :items="orders"
            hide-details
            clearable
            @update:model-value="rulesLoader.reload()"
          ></v-select>
        </v-col>
        <v-col sm="auto">
          <v-btn
            variant="flat"
            block
            height="40"
            color="info"
            :prepend-icon="mdiRefresh"
            :loading="loading"
            @click="request()"
          >
            {{ t('app.actions.refresh') }}
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn
            height="40"
            color="success"
            variant="flat"
            :prepend-icon="mdiPlus"
            block
            :loading="creating"
            @click="createRule()"
          >
            {{ t('app.actions.add') }}
          </v-btn>
        </v-col>
      </v-row>
      <v-divider class="my-2"></v-divider>
      <multi-items-loader :loader="rulesLoader" class="px-0 py-2 mt-2" auto>
        <v-row>
          <v-col v-for="rule in rules" :key="rule.id" cols="12" sm="6" md="4">
            <rule-overview class="h-100" :rule="rule" @deleted="onRuleDeleted"></rule-overview>
          </v-col>
        </v-row>
      </multi-items-loader>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { mdiMagnify, mdiPlus, mdiRefresh } from '@mdi/js';
import { ref } from 'vue';
import { debounce } from '@/utils/utils';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { RuleEntity, RuleQueryDto } from '@/api/interfaces/subscribe.interface';
import { useApiStore } from '@/store/api';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import DefaultTemplateCode from '@/api/templates/default.ts?raw';
import RuleOverview from '@/components/rule/RuleOverview.vue';

const { t } = useI18n();
const api = useApiStore();
const router = useRouter();
const toast = useToastStore();

const orders = [
  {
    title: t('app.input.desc'),
    value: 'DESC',
  },
  {
    title: t('app.input.asc'),
    value: 'ASC',
  },
];

const rulesLoader = useAxiosPageLoader(
  async (query: RuleQueryDto = {}) => {
    return await api.Rule.query({
      ...query,
      order: filters.value.order,
      keyword: filters.value.keyword,
    });
  },
  { page: 0, size: 24 },
);
const { items: rules, pending: loading, reload: request } = rulesLoader;

const filters = ref<Partial<RuleQueryDto>>({
  keyword: '',
  order: 'DESC',
});
const useQuery = debounce(rulesLoader.reload, 1000);

const {
  pending: creating,
  request: createRule,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.create({
    remark: t('rule.unnamed'),
    code: DefaultTemplateCode,
  });
});
onCreated(async (data) => {
  await router.push({ path: `/rule/${data.id}` });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const onRuleDeleted = (rule: RuleEntity) => {
  rules.value = rules.value.filter(({ id }) => id !== rule.id);
};
</script>

<style scoped lang="sass"></style>
