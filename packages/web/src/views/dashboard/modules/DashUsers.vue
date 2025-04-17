<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col sm="auto">
        <v-btn variant="flat" block color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus" @click="createNew()">
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
        multi-sort
        :headers="headers"
        :items-length="total"
        :items="users?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((users?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        expand-on-click
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length">
              <v-row class="py-2" v-if="item.permissionNames.length > 0" dense>
                <v-col cols="auto" v-for="name in item.permissionNames" :key="name">
                  <v-chip color="info" density="comfortable" label>{{ name }}</v-chip>
                </v-col>
              </v-row>
              <span v-else class="text-subtitle-2 font-weight-bold">{{ t('user.noPermissions') }}</span>
            </td>
          </tr>
        </template>
        <template #item.avatar="{ item }">
          <v-tooltip>
            {{ item.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.avatar && api.File.buildRawPath(item.avatar)"
                size="40"
              ></user-avatar>
            </template>
          </v-tooltip>
        </template>
        <template #item.notify="{ item }">
          <v-icon size="small" :icon="item.notify ? mdiCheck : mdiClose"></v-icon>
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

    <v-dialog
      :class="display.smAndUp.value ? 'w-75' : 'w-100'"
      close-on-back
      :fullscreen="!display.smAndUp.value"
      v-model="permissionDialog"
      scrollable
    >
      <v-card v-if="editItem">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="permissionDialog = false"></v-btn>
          <v-toolbar-title>
            {{ t('app.actions.edit') }}
            {{ t('user.entity.permissions') }}
          </v-toolbar-title>
          <v-btn
            variant="text"
            :prepend-icon="mdiCheck"
            :loading="permissionsChanging"
            @click="changePermissions(editItem)"
          >
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="px-0 py-4">
          <v-list class="overflow-x-hidden" v-model:selected="editItem.permissionNames" select-strategy="leaf">
            <v-list-subheader>{{ t('user.permission.groups.presets') }}</v-list-subheader>
            <v-row dense class="px-4">
              <v-col v-for="(preset, presetIndex) in presets" :key="presetIndex" cols="auto">
                <v-chip variant="outlined" label link @click="editItem.permissionNames = preset.permissions.concat()">
                  {{ preset.text }}
                </v-chip>
              </v-col>
            </v-row>
            <template v-for="(group, groupIndex) in permissions" :key="groupIndex">
              <v-list-subheader>{{ group.name }}</v-list-subheader>
              <v-list-item
                v-for="(item, itemIndex) in group.items"
                :key="`${groupIndex}-${itemIndex}`"
                :value="item.value"
              >
                <template v-slot:prepend="{ isActive }">
                  <v-list-item-action start>
                    <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                  </v-list-item-action>
                </template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
              <v-divider v-if="groupIndex !== permissions.length - 1"></v-divider>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      :class="display.smAndUp.value ? 'w-75' : 'w-100'"
      close-on-back
      :fullscreen="!display.smAndUp.value"
      v-model="editDialog"
      scrollable
    >
      <v-card v-if="editItem">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="editDialog = false"></v-btn>
          <v-toolbar-title>
            {{ editItem?.id ? t('app.actions.edit') : t('app.actions.add') }}
            {{ t('app.entities.user') }}
          </v-toolbar-title>
          <v-btn variant="text" :prepend-icon="mdiCheck" :loading="userSaving" @click="saveUser(editItem)">
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-6">
          <v-container class="pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('user.entity.username') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              :disabled="editItem.id != null"
              hide-details
              color="primary"
              density="compact"
              v-model.trim="editItem.username"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('user.entity.password') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              autocomplete="one-time-code"
              v-model.trim="editItem.password"
              :type="passwordView ? 'text' : 'password'"
              :append-inner-icon="passwordView ? mdiEyeOff : mdiEye"
              @click:append-inner="passwordView = !passwordView"
            ></v-text-field>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.user') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.username }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="userDeleting" @click="deleteUser(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import {
  mdiAccountTagOutline,
  mdiCheck,
  mdiClose,
  mdiDelete,
  mdiEye,
  mdiEyeOff,
  mdiLockReset,
  mdiMagnify,
  mdiPlus,
  mdiRefresh,
} from '@mdi/js';
import { debounce } from '@/utils/utils';
import { useToastStore } from '@/store/toast';
import { useDisplay } from 'vuetify';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();
const display = useDisplay();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const total = ref(0);
const filters = ref<UserQueryDto>({});
const {
  pending: loading,
  request,
  data: users,
  onResolved: onUsersLoaded,
} = useAxiosRequest(async () => {
  return await api.User.query({
    ...Object.fromEntries(
      Object.entries(filters.value)
        .filter(([_, value]) => value != undefined && String(value).length > 0)
        .map(([key, value]) => [key, String(value)]),
    ),
    page: page.value - 1,
    size: size.value,
    sort: (sortBy.value ?? []).map(({ key, order }) => `${key}:${order.toUpperCase()}`) as any,
  });
});
onUsersLoaded((data) => {
  total.value = data.total;
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
    title: t('user.entity.notify'),
    key: 'notify',
  },
  {
    title: t('user.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<UserEntity & { password: string }>();

const editDialog = ref(false);
const passwordView = ref(false);
const createNew = () => {
  editItem.value = {} as any;
  editDialog.value = true;
};
const {
  pending: userSaving,
  request: saveUser,
  onResolved: onUserSaved,
  onRejected: onUserSaveFailed,
} = useAxiosRequest(async (user: UserEntity) => {
  if (user.id) {
    return await api.Auth.changeUserPassword(user.id)({
      current: editItem.value!.password,
    });
  } else {
    return api.Auth.createUser({
      username: editItem.value!.username,
      password: editItem.value!.password,
      permissionNames: [],
    });
  }
});
onUserSaved(async (data) => {
  if (users.value && 'id' in data) {
    const index = users.value?.items.findIndex(({ id }) => id === data.id) ?? -1;
    if (index > -1) {
      users.value.items[index] = data;
    } else {
      users.value.items.unshift(data);
    }
  }

  editDialog.value = false;
});
onUserSaveFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const permissionDialog = ref(false);
const permissions = [
  {
    name: t('user.permission.groups.file'),
    items: [
      { name: t('user.permission.fullAccess'), value: PermissionEnum.FILE_OP },
      { name: t('user.permission.uploadVideo'), value: PermissionEnum.FILE_UPLOAD_VIDEO },
      { name: t('user.permission.uploadImage'), value: PermissionEnum.FILE_UPLOAD_IMAGE },
    ],
  },
  {
    name: t('user.permission.groups.media'),
    items: [
      { name: t('user.permission.fullAccess'), value: PermissionEnum.MEDIA_OP },
      { name: t('user.permission.view'), value: PermissionEnum.MEDIA_VIEW },
    ],
  },
  {
    name: t('user.permission.groups.subscribe'),
    items: [
      { name: t('user.permission.fullAccess'), value: PermissionEnum.SUBSCRIBE_OP },
      { name: t('user.permission.view'), value: PermissionEnum.SUBSCRIBE_VIEW },
    ],
  },
  {
    name: t('user.permission.groups.live'),
    items: [
      { name: t('user.permission.fullAccess'), value: PermissionEnum.LIVE_OP },
      { name: t('user.permission.view'), value: PermissionEnum.LIVE_VIEW },
    ],
  },
];
const presets = [
  {
    text: t('user.permission.presets.administrator'),
    permissions: [PermissionEnum.FILE_OP, PermissionEnum.MEDIA_OP, PermissionEnum.SUBSCRIBE_OP, PermissionEnum.LIVE_OP],
  },
  {
    text: t('user.permission.presets.user'),
    permissions: [
      PermissionEnum.FILE_UPLOAD_IMAGE,
      PermissionEnum.MEDIA_VIEW,
      PermissionEnum.SUBSCRIBE_VIEW,
      PermissionEnum.LIVE_VIEW,
    ],
  },
  {
    text: t('user.permission.presets.guest'),
    permissions: [PermissionEnum.MEDIA_VIEW],
  },
  {
    text: t('user.permission.presets.banned'),
    permissions: [],
  },
];
const {
  pending: permissionsChanging,
  request: changePermissions,
  onResolved: onPermissionsChanged,
  onRejected: onPermissionsChangeFailed,
} = useAxiosRequest(async (user: UserEntity) => {
  return await api.Auth.grantUser(user.id)({ permissionNames: user.permissionNames });
});
onPermissionsChanged(async (data) => {
  if (users.value) {
    const index = users.value?.items.findIndex(({ id }) => id === data.id) ?? -1;
    if (index > -1) {
      users.value.items[index] = data;
    }
  }

  permissionDialog.value = false;
});
onPermissionsChangeFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: userDeleting,
  request: deleteUser,
  onResolved: onUserDeleted,
  onRejected: onUserDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Auth.deleteUser(id)();
});
onUserDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (users.value) {
    users.value.items = users.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onUserDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('user.actions.modifyPermissions'),
    icon: mdiAccountTagOutline,
    color: 'info',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => {
      editItem.value = { ...item, password: '' };
      permissionDialog.value = true;
    },
  },
  {
    text: t('user.actions.resetPassword'),
    icon: mdiLockReset,
    color: 'info',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => {
      editItem.value = { ...item, password: '' };
      editDialog.value = true;
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: UserEntity) =>
      item.id !== api.user?.id &&
      api.hasPermission(PermissionEnum.ROOT_OP) &&
      !item.permissionNames?.includes(PermissionEnum.ROOT_OP),
    click: (item: UserEntity) => {
      editItem.value = { ...item, password: '' };
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
