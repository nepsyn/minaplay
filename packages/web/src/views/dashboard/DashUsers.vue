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
        <v-text-field
          variant="outlined"
          color="primary"
          hide-details
          :label="t('user.entity.username')"
          density="compact"
          v-model.trim="filters.username"
          clearable
          @update:model-value="useQuery"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="users?.total ?? 0"
        :items="users?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((users?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.avatar="{ item }">
          <v-tooltip>
            {{ item.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.avatar && api.File.buildRawPath(item.avatar.id)"
                size="40"
              ></user-avatar>
            </template>
          </v-tooltip>
        </template>
        <template #item.notify="{ item }">
          <v-icon size="small" :icon="item.notify ? mdiCheck : mdiClose"></v-icon>
        </template>
        <template #item.createAt="{ item }">
          {{ new Date(item.createAt).toLocaleString(locale) }}
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { PermissionEnum } from '@/api/enums/permission.enum';
import { UserEntity, UserQueryDto } from '@/api/interfaces/user.interface';
import { mdiAccountTagOutline, mdiCheck, mdiClose, mdiDelete, mdiLockReset, mdiMagnify, mdiPlus } from '@mdi/js';
import { debounce } from '@/utils/utils';

const { t, locale } = useI18n();
const api = useApiStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<UserQueryDto>({});
const {
  pending: loading,
  request,
  data: users,
} = useAxiosRequest(async () => {
  return await api.User.query({
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

const headers = ref([
  {
    title: t('user.entity.username'),
    key: 'username',
  },
  {
    title: t('user.entity.avatar'),
    key: 'avatar',
    sortable: false,
  },
  {
    title: t('user.entity.email'),
    key: 'email',
    sortable: false,
  },
  {
    title: t('user.entity.notify'),
    key: 'notify',
  },
  {
    title: t('user.entity.createAt'),
    key: 'createAt',
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const actions = [
  {
    text: t('user.actions.modifyPermissions'),
    icon: mdiAccountTagOutline,
    color: 'info',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => undefined,
  },
  {
    text: t('user.actions.resetPassword'),
    icon: mdiLockReset,
    color: 'info',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => undefined,
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => undefined,
  },
];
</script>

<style scoped lang="sass"></style>
