<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus">
          {{ t('app.actions.add') }}
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
          :items="sourcesLoader.data.value?.items ?? []"
          :item-title="(item) => item.title ?? item.remark ?? t('rule.unnamed')"
          item-value="id"
          :no-data-text="t('app.loader.empty')"
          density="compact"
          :loading="sourcesLoader.pending.value"
          v-model.number="filters.sourceId"
          clearable
          @focus.once="sourcesLoader.request()"
          :item-props="(item) => ({ density: 'comfortable', subtitle: item.url })"
          @update:model-value="request"
        ></v-autocomplete>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="rules?.total ?? 0"
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
              {{ source.title }}
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
        <template #item.createAt="{ item }">
          {{ new Date(item.createAt).toLocaleString(locale) }}
        </template>
        <template #item.updateAt="{ item }">
          {{ new Date(item.updateAt).toLocaleString(locale) }}
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
  </v-container>
</template>

<script setup lang="ts">
import { mdiDelete, mdiMagnify, mdiPencil, mdiPlus } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { RuleEntity, RuleQueryDto } from '@/api/interfaces/subscribe.interface';
import BlankFavicon from '@/assets/blank-favicon.png';

const { t, locale } = useI18n();
const api = useApiStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<RuleQueryDto>({});
const {
  pending: loading,
  request,
  data: rules,
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
const useQuery = debounce(request, 1000);

const sourcesLoader = useAxiosRequest(async () => {
  return await api.Source.query({ size: 1024 });
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
  },
  {
    title: t('rule.entity.sources'),
    key: 'sources',
  },
  {
    title: t('rule.entity.createAt'),
    key: 'createAt',
  },
  {
    title: t('rule.entity.updateAt'),
    key: 'updateAt',
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const actions = [
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: RuleEntity) => true,
    click: (item: RuleEntity) => undefined,
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: RuleEntity) => true,
    click: (item: RuleEntity) => undefined,
  },
];
</script>

<style scoped lang="sass"></style>
