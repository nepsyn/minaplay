<script setup lang="ts">
import { mdiAccountMultiple, mdiCheck, mdiChevronDown, mdiChevronUp, mdiClose, mdiRefresh } from '@mdi/js';
import { ref } from 'vue';
import { UserEntity, UserQueryDto } from '@/interfaces/user.interface';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import UserAvatar from '@/components/provider/UserAvatar.vue';

const app = useApp();

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
  loading.value = true;
  try {
    const response = await Api.User.query({
      ...query.value,
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

const edit = ref<UserQueryDto>({
  keyword: undefined,
  username: undefined,
});
const query = ref<UserQueryDto>({});
const expand = ref(false);
const reset = async () => {
  edit.value.keyword = undefined;
  edit.value.username = undefined;
};
const useQuery = async () => {
  query.value = Object.assign({}, edit.value);
  options.value.page = 1;
  await loadItems(options.value);
};
</script>

<template>
  <v-container>
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
            <v-col cols="12" sm="6">
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
              @click="useQuery"
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
            <v-btn variant="tonal" color="warning" text="修改权限" size="small"></v-btn>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
