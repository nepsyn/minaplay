<script setup lang="ts">
import { useApp } from '@/store/app';
import { ref, watch } from 'vue';
import { Api } from '@/api/api';
import { SourceEntity, SourceQueryDto } from '@/interfaces/subscribe.interface';
import {
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiContentCopy,
  mdiPencil,
  mdiRefresh,
  mdiRssBox,
} from '@mdi/js';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import UserAvatar from '@/components/provider/UserAvatar.vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

const app = useApp();
const route = useRoute();
const router = useRouter();

const items = ref<SourceEntity[]>([]);
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
    title: '标题',
    key: 'title',
  },
  {
    title: '备注',
    key: 'remark',
  },
  {
    title: '链接',
    key: 'url',
  },
  {
    title: 'CRON',
    key: 'cron',
  },
  {
    title: '创建时间',
    key: 'createAt',
  },
  {
    title: '启用状态',
    key: 'enabled',
  },
  {
    title: '创建用户',
    key: 'user',
    sortable: false,
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
    const response = await Api.SubscribeSource.query({
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
const edit = ref<SourceQueryDto>({});
watch(
  () => [route.path, route.query],
  (newValue, oldValue) => {
    if (newValue[0] !== oldValue?.[0] && route.name === 'admin-subscribe') {
      edit.value = Object.assign({}, route.query);
      options.value.page = 1;
    }
  },
  { immediate: true },
);
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.name === 'admin-subscribe') {
    edit.value = Object.assign({}, to.query);
    options.value.page = 1;
    await loadItems(options.value);
  }
  next();
});
const reset = async () => {
  edit.value = {};
};

const toggleEnabledId = ref<number | undefined>(undefined);
const toggleEnabled = async (id: number, enabled: boolean) => {
  toggleEnabledId.value = id;
  try {
    await Api.SubscribeSource.update(id)({ enabled });
  } catch {
    app.toastError('切换启用状态失败');
  } finally {
    toggleEnabledId.value = undefined;
  }
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiRssBox"></v-icon>
        <span class="ml-4 text-h5">订阅管理</span>
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
                label="订阅源ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="edit.url"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="订阅源链接(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="edit.enabled"
                :items="[
                  { title: '是', value: '1' },
                  { title: '否', value: '0' },
                ]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="是否启用(精确查询)"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="edit.userId"
                type="number"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="订阅源创建用户ID(精确查询)"
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
          <template #item.url="{ item }">
            <v-tooltip :text="item.raw.url ?? '未设置'">
              <template #activator="{ props }">
                <action-btn
                  color="primary"
                  text="复制链接"
                  :icon="mdiContentCopy"
                  size="small"
                  v-bind="props"
                  variant="tonal"
                  @click="app.copyContent(item.raw.url)"
                ></action-btn>
              </template>
            </v-tooltip>
          </template>
          <template #item.enabled="{ item }">
            <v-switch
              density="compact"
              color="secondary"
              hide-details
              v-model="item.raw.enabled"
              :loading="toggleEnabledId === item.raw.id"
              :disabled="toggleEnabledId === item.raw.id"
              @change="toggleEnabled(item.raw.id, item.raw.enabled)"
            ></v-switch>
          </template>
          <template #item.user="{ item }">
            <v-tooltip :text="item.raw.user?.username ?? '未设置'">
              <template #activator="{ props }">
                <user-avatar
                  v-bind="props"
                  size="40"
                  :src="item.raw.user?.avatar && Api.File.buildRawPath(item.raw.user.avatar.id)"
                ></user-avatar>
              </template>
            </v-tooltip>
          </template>
          <template #item.createAt="{ item }">
            {{ new Date(item.raw.createAt).toLocaleString() }}
          </template>
          <template #item.actions="{ item }">
            <v-container fluid class="pa-0 d-flex flex-row">
              <action-btn
                text="编辑"
                :icon="mdiPencil"
                variant="tonal"
                color="secondary"
                size="small"
                @click.stop="router.push(`/subscribe/${item.raw.id}`)"
              ></action-btn>
            </v-container>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
