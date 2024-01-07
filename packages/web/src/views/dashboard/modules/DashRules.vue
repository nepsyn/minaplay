<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus" :loading="creating" @click="createRule()">
          {{ t('app.actions.add') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12" sm="6">
        <v-text-field
          variant="outlined"
          color="primary"
          :prepend-inner-icon="mdiMagnify"
          hide-details
          :label="t('app.input.keyword')"
          density="compact"
          v-model.trim="filters.keyword"
          clearable
          @update:model-value="useQuery"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-autocomplete
          variant="outlined"
          color="primary"
          hide-details
          :label="t('app.entities.source')"
          :items="sources ?? []"
          :item-title="(item) => item.title || item.remark || t('rule.unnamed')"
          item-value="id"
          :no-data-text="t('app.loader.empty')"
          density="compact"
          :loading="sourcesLoading"
          v-model.number="filters.sourceId"
          v-model:search="sourceKeyword"
          clearable
          :item-props="(item) => ({ density: 'comfortable', subtitle: item.url })"
          @focus.once="loadSources()"
          @update:model-value="request()"
          @update:search="!filters.sourceId && useSourceQuery()"
        ></v-autocomplete>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="total"
        :items="rules?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((rules?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.sources="{ item }">
          <div class="d-flex flex-row">
            <v-tooltip v-for="source in item.sources ?? []" :key="source.id">
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
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <template v-for="(action, index) in actions" :key="index">
              <v-tooltip>
                {{ action.text }}
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    v-if="action.show(item)"
                    :color="action.color"
                    :icon="action.icon"
                    variant="text"
                    density="comfortable"
                    @click.stop="action.click(item)"
                  >
                  </v-btn>
                </template>
              </v-tooltip>
            </template>
          </div>
        </template>
      </v-data-table-server>
    </v-sheet>

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.rule') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.remark || t('rule.unnamed') }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="ruleDeleting" @click="deleteRule(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { mdiDelete, mdiMagnify, mdiPencil, mdiPlus, mdiRefresh } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { RuleEntity, RuleQueryDto, SourceQueryDto } from '@/api/interfaces/subscribe.interface';
import BlankFavicon from '@/assets/blank-favicon.png';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import DefaultTemplateCode from '@/assets/templates/default.ts?raw';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';

const { t, locale } = useI18n();
const api = useApiStore();
const router = useRouter();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const total = ref(0);
const filters = ref<RuleQueryDto>({});
const {
  pending: loading,
  request,
  data: rules,
  onResolved: onRulesLoaded,
} = useAxiosRequest(async () => {
  return await api.Rule.query({
    ...Object.fromEntries(
      Object.entries(filters.value)
        .filter(([_, value]) => value != undefined && String(value).length > 0)
        .map(([key, value]) => [key, String(value)]),
    ),
    page: page.value - 1,
    size: size.value,
    sort: sortBy.value?.[0]?.key,
    order: sortBy.value[0]?.order?.toUpperCase(),
  });
});
onRulesLoaded((data) => {
  total.value = data.total;
});
const useQuery = debounce(request, 1000);

const sourceKeyword = ref('');
const {
  pending: sourcesLoading,
  request: loadSources,
  items: sources,
  reset: resetSources,
  onRejected: onSourcesLoadFailed,
} = useAxiosPageLoader(
  async (query?: SourceQueryDto) => {
    return await api.Source.query(query);
  },
  { page: 0, size: 24 },
);
const useSourceQuery = debounce(
  async () => {
    resetSources();
    await loadSources({
      keyword: sourceKeyword.value,
      sort: 'createAt',
      order: 'DESC',
    });
  },
  500,
  false,
);
onSourcesLoadFailed((error: any) => {
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

const headers = ref([
  {
    title: t('rule.entity.remark'),
    key: 'remark',
    value: (row: any) => row.remark || t('rule.unnamed'),
  },
  {
    title: t('rule.entity.sources'),
    key: 'sources',
  },
  {
    title: t('rule.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.updateAt).toLocaleString(locale.value),
  },
  {
    title: t('rule.entity.updateAt'),
    key: 'updateAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<RuleEntity | undefined>(undefined);

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

const deleteDialog = ref(false);
const {
  pending: ruleDeleting,
  request: deleteRule,
  onResolved: onRuleDeleted,
  onRejected: onRuleDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Rule.delete(id)();
});
onRuleDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (rules.value) {
    rules.value.items = rules.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onRuleDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: RuleEntity) => true,
    click: (item: RuleEntity) => {
      router.push({ path: `/rule/${item.id}` });
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: RuleEntity) => true,
    click: (item: RuleEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
