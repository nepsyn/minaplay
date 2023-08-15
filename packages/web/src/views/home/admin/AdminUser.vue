<script setup lang="ts">
import {
  mdiAccountMultiple,
  mdiAccountTagOutline,
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiRefresh,
} from '@mdi/js';
import { ref, watch } from 'vue';
import { UserEntity, UserQueryDto } from '@/interfaces/user.interface';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import UserAvatar from '@/components/provider/UserAvatar.vue';
import { PermissionEnum } from '@/api/enums/permission.enum';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import PermissionEditDialog from '@/components/edit/PermissionEditDialog.vue';

const app = useApp();
const router = useRouter();
const route = useRoute();

const items = ref<UserEntity[]>([]);
const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
});
const total = ref(0);
const loading = ref(false);
const headers = ref([
  {
    title: '#',
    key: 'id',
  },
  {
    title: '用户名',
    key: 'username',
  },
  {
    title: '头像',
    key: 'avatar',
    sortable: false,
  },
  {
    title: '创建时间',
    key: 'createAt',
  },
  {
    title: '操作',
    key: 'actions',
    sortable: false,
  },
]);
const loadItems = async ({ page, itemsPerPage, sortBy }: any) => {
  items.value = [];
  loading.value = true;
  try {
    const response = await Api.User.query({
      ...Object.fromEntries(
        Object.entries(edit.value)
          .filter(([_, value]) => value !== undefined && String(value).length > 0)
          .map(([key, value]) => [key, String(value)]),
      ),
      page: page - 1,
      size: itemsPerPage,
      sort: sortBy?.[0]?.key,
      order: sortBy?.[0]?.order?.toUpperCase(),
    });
    items.value = response.data.items;
    total.value = response.data.total;
  } catch {
    app.toastError('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const expand = ref(false);
const edit = ref<UserQueryDto>({});
watch(
  () => [route.path, route.query],
  (newValue, oldValue) => {
    if (newValue[0] !== oldValue?.[0] && route.name === 'admin-user') {
      edit.value = Object.assign({}, route.query);
      options.value.page = 1;
    }
  },
  { immediate: true },
);
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.name === 'admin-user') {
    edit.value = Object.assign({}, to.query);
    options.value.page = 1;
    await loadItems(options.value);
  }
  next();
});
const reset = async () => {
  edit.value = {};
};

const editDialog = ref(false);
const editItem = ref<UserEntity>({} as any);
const openEdit = (item?: UserEntity) => {
  editItem.value = Object.assign({}, item);
  editDialog.value = true;
};
const onEditSaved = (data: UserEntity) => {
  const index = items.value.findIndex(({ id }) => id === data.id);
  if (index > -1) {
    items.value[index] = data;
  } else {
    items.value.unshift(data);
  }
  app.toastSuccess('保存用户权限成功');
};
const onEditError = (error: any) => {
  app.toastError('保存用户权限失败');
};
</script>

<template>
  <v-container fluid class="py-4 px-6">
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiAccountMultiple"></v-icon>
        <span class="ml-4 text-h5">用户管理</span>
      </v-container>
      <v-spacer></v-spacer>
      <action-btn
        color="primary"
        class="ms-2"
        :icon="expand ? mdiChevronUp : mdiChevronDown"
        :text="expand ? '收起条件查询' : '展开条件查询'"
        @click="expand = !expand"
      ></action-btn>
    </v-container>
    <v-expand-transition>
      <v-container v-if="expand" fluid class="d-flex flex-column">
        <v-sheet rounded border class="pa-4 d-flex flex-column">
          <span class="text-h6">条件查询</span>
          <v-row class="mt-2">
            <v-col cols="12">
              <v-text-field
                v-model.trim="edit.keyword"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="查询关键字(模糊查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="edit.id"
                type="number"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="用户ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="edit.username"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="用户名(精确查询)"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-container fluid class="px-0 d-flex flex-row">
            <v-spacer></v-spacer>
            <action-btn text="重置" :icon="mdiClose" color="error" variant="tonal" @click="reset"></action-btn>
            <action-btn
              class="ms-2"
              text="应用"
              :icon="mdiCheck"
              color="primary"
              variant="tonal"
              @click="loadItems(options)"
            ></action-btn>
          </v-container>
        </v-sheet>
      </v-container>
    </v-expand-transition>
    <v-container fluid class="d-flex flex-column">
      <v-sheet rounded border>
        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          v-model:page="options.page"
          v-model:sort-by="options.sortBy"
          :headers="headers"
          :items-length="total"
          :items="items"
          :loading="loading"
          color="primary"
          loading-text="加载中..."
          no-data-text="没有找到记录"
          items-per-page-text="每页数量："
          :page-text="`第 ${options.page} 页，共 ${Math.ceil(total / options.itemsPerPage)} 页`"
          hover
          item-value="id"
          @update:options="loadItems"
          density="compact"
          class="text-caption font-weight-bold"
        >
          <template #bottom>
            <v-divider></v-divider>
            <v-container fluid class="py-1 px-2 d-flex flex-row align-center">
              <action-btn
                color="primary"
                text="刷新"
                :icon="mdiRefresh"
                size="small"
                @click="loadItems(options)"
              ></action-btn>
              <v-spacer></v-spacer>
              <v-pagination
                show-first-last-page
                density="compact"
                total-visible="5"
                v-model="options.page"
                :length="Math.ceil(total / options.itemsPerPage)"
              ></v-pagination>
            </v-container>
          </template>
          <template #item.avatar="{ item }">
            <user-avatar :src="item.raw.avatar && Api.File.buildRawPath(item.raw.avatar.id)" size="40"></user-avatar>
          </template>
          <template #item.createAt="{ item }">
            {{ new Date(item.raw.createAt).toLocaleString() }}
          </template>
          <template #item.actions="{ item }">
            <v-container fluid class="pa-0 d-flex flex-row">
              <action-btn
                v-if="
                  item.raw.id !== app.user?.id &&
                  app.hasPermission(PermissionEnum.ROOT_OP) &&
                  !item.raw.permissionNames?.includes(PermissionEnum.ROOT_OP)
                "
                text="修改权限"
                :icon="mdiAccountTagOutline"
                size="small"
                color="warning"
                variant="tonal"
                @click.stop="openEdit(item.raw)"
              ></action-btn>
            </v-container>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
    <permission-edit-dialog
      v-model="editDialog"
      :item="editItem"
      @saved="onEditSaved"
      @error="onEditError"
    ></permission-edit-dialog>
  </v-container>
</template>

<style scoped lang="sass"></style>
