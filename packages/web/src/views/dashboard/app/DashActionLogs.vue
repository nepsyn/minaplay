<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12" sm="6">
        <v-autocomplete
          variant="outlined"
          color="primary"
          hide-details
          :label="t('actionLog.entity.operator')"
          :items="users ?? []"
          :item-title="(item) => item.username"
          item-value="id"
          :no-data-text="t('app.loader.empty')"
          density="compact"
          :loading="usersLoading"
          v-model.number="filters.operatorId"
          v-model:search="userKeyword"
          clearable
          @focus.once="loadUsers()"
          @update:model-value="request()"
          @update:search="!filters.operatorId && useUserQuery()"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          variant="outlined"
          color="primary"
          hide-details
          :label="t('actionLog.entity.action')"
          :items="actionOptions"
          density="compact"
          v-model="filters.action"
          clearable
          @update:model-value="request"
        ></v-select>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="total"
        :items="logs?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((logs?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.operator="{ item }">
          <v-tooltip>
            {{ item.operator.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.operator.avatar && api.File.buildRawPath(item.operator.avatar.id)"
                size="40"
              ></user-avatar>
            </template>
          </v-tooltip>
        </template>
        <template #item.target="{ item }">
          <v-tooltip>
            {{ item.target.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.target.avatar && api.File.buildRawPath(item.target.avatar.id)"
                size="40"
              ></user-avatar>
            </template>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { mdiRefresh } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { ActionLogQueryDto } from '@/api/interfaces/auth.interface';
import { AuthActionEnum } from '@/api/enums/auth-action.enum';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useToastStore } from '@/store/toast';
import { UserQueryDto } from '@/api/interfaces/user.interface';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const total = ref(0);
const filters = ref<ActionLogQueryDto>({});
const {
  pending: loading,
  request,
  data: logs,
  onResolved: onLogsLoaded,
} = useAxiosRequest(async () => {
  return await api.Auth.queryActionLogs({
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
onLogsLoaded((data) => {
  total.value = data.total;
});

const userKeyword = ref('');
const {
  pending: usersLoading,
  request: loadUsers,
  items: users,
  reset: resetUsers,
  onRejected: onUsersLoadFailed,
} = useAxiosPageLoader(
  async (query?: UserQueryDto) => {
    return await api.User.query(query);
  },
  { page: 0, size: 24 },
);
const useUserQuery = debounce(
  async () => {
    resetUsers();
    await loadUsers({
      keyword: userKeyword.value,
      sort: 'username',
      order: 'ASC',
    });
  },
  500,
  false,
);
onUsersLoadFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actionOptions = [
  { title: t(`actionLog.actions.${AuthActionEnum.LOGIN}`), value: AuthActionEnum.LOGIN },
  { title: t(`actionLog.actions.${AuthActionEnum.LOGOUT}`), value: AuthActionEnum.LOGOUT },
  { title: t(`actionLog.actions.${AuthActionEnum.REFRESH}`), value: AuthActionEnum.REFRESH },
  { title: t(`actionLog.actions.${AuthActionEnum.GRANT}`), value: AuthActionEnum.GRANT },
  { title: t(`actionLog.actions.${AuthActionEnum.CHANGE_PASSWORD}`), value: AuthActionEnum.CHANGE_PASSWORD },
];
const headers = ref([
  {
    title: t('actionLog.entity.ip'),
    key: 'ip',
  },
  {
    title: t('actionLog.entity.action'),
    key: 'action',
    value: (row: any) => t(`actionLog.actions.${row.action}`),
  },
  {
    title: t('actionLog.entity.operator'),
    key: 'operator',
    sortable: false,
  },
  {
    title: t('actionLog.entity.target'),
    key: 'target',
    sortable: false,
  },
  {
    title: t('user.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
]);
</script>

<style scoped lang="sass"></style>
