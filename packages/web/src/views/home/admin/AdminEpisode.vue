<script setup lang="ts">
import { useApp } from '@/store/app';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { ref, watch } from 'vue';
import { Api } from '@/api/api';
import { EpisodeEntity, EpisodeQueryDto } from '@/interfaces/series.interface';
import {
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiDelete,
  mdiPencil,
  mdiPlus,
  mdiRefresh,
  mdiShare,
  mdiViewComfy,
} from '@mdi/js';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { VDataTableServer } from 'vuetify/labs/components';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import ViewImg from '@/components/provider/ViewImg.vue';
import EpisodeEditDialog from '@/components/dialogs/EpisodeEditDialog.vue';
import MenuProvider from '@/components/provider/MenuProvider.vue';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const items = ref<EpisodeEntity[]>([]);
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
    title: '集数',
    key: 'no',
  },
  {
    title: '标题',
    key: 'title',
  },
  {
    title: '剧集',
    key: 'series',
    sortable: false,
  },
  {
    title: '媒体文件',
    key: 'media',
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
    const response = await Api.Episode.query({
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
    app.toastError('获取媒体文件列表失败');
  } finally {
    loading.value = false;
  }
};

const expand = ref(false);
const edit = ref<EpisodeQueryDto>({});
watch(
  () => [route.path, route.query],
  async (newValue, oldValue) => {
    if (newValue[0] !== oldValue?.[0] && route.name === 'admin-episode') {
      edit.value = Object.assign({}, route.query);
      options.value.page = 1;
      if (oldValue?.[0]) {
        await loadItems(options.value);
      }
    }
  },
  { immediate: true },
);
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.name === 'admin-episode') {
    edit.value = Object.assign({}, to.query);
    options.value.page = 1;
    await loadItems(options.value);
  }
  next();
});
const reset = async () => {
  edit.value = {};
};

const deleteItem = async (id: number) => {
  loading.value = true;
  try {
    await Api.Episode.delete(id)();
    items.value = items.value.filter(({ id: val }) => val !== id);
    app.toastSuccess('删除单集成功');
  } catch {
    app.toastError('删除单集失败');
  } finally {
    loading.value = false;
  }
};

const actions = [
  {
    text: '转到',
    icon: mdiShare,
    color: 'primary',
    menu: undefined,
    show: (item: any) => true,
    click: (item: any) => router.push(`/ep/${item.raw.id}`),
  },
  {
    text: '编辑',
    icon: mdiPencil,
    color: 'secondary',
    menu: undefined,
    show: (item: any) => true,
    click: (item: any) => openEdit(item.raw),
  },
  {
    text: '删除',
    icon: mdiDelete,
    color: 'error',
    menu: {
      title: '删除确认',
      text: '确定要删除该单集吗？该操作不可撤销！',
    },
    show: (item: any) => true,
    click: (item: any) => deleteItem(item.raw.id),
  },
];

const editDialog = ref(false);
const editItem = ref<EpisodeEntity>({} as any);
const openEdit = (item: EpisodeEntity) => {
  editItem.value = Object.assign({}, item);
  editDialog.value = true;
};
const onEditSaved = (data: EpisodeEntity) => {
  const index = items.value.findIndex(({ id }) => id === editItem.value!.id);
  if (index > -1) {
    items.value[index] = data;
  } else {
    items.value.unshift(data);
  }
  editDialog.value = false;
  app.toastSuccess('保存单集信息成功');
};
const onEditError = (error: any) => {
  app.toastError('保存单集信息失败');
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiViewComfy"></v-icon>
        <span class="ml-4 text-h5">单集</span>
      </v-container>
      <v-spacer></v-spacer>
      <action-btn color="warning" :icon="mdiPlus" text="新建" @click="openEdit"></action-btn>
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
                v-model.trim="edit.id"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="单集ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="edit.seriesId"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="剧集ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="edit.start"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="创建起始时间范围(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="edit.end"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="创建结束时间范围(精确查询)"
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
          <template #item.series="{ item }">
            <v-container class="pa-1">
              <view-img
                :aspect-ratio="3 / 4"
                min-width="32"
                max-width="64"
                :src="item.raw.series.poster ? Api.File.buildRawPath(item.raw.series.poster.id) : MediaCoverFallback"
              ></view-img>
            </v-container>
          </template>
          <template #item.media="{ item }">
            <v-container class="pa-1">
              <view-img
                min-width="80"
                max-width="120"
                :src="item.raw.media.poster ? Api.File.buildRawPath(item.raw.media.poster.id) : MediaCoverFallback"
              ></view-img>
            </v-container>
          </template>
          <template #item.createAt="{ item }">
            {{ new Date(item.raw.createAt).toLocaleString() }}
          </template>
          <template #item.actions="{ item }">
            <menu-provider :actions="actions" :item="item" :boxed="display.smAndDown.value"></menu-provider>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
    <episode-edit-dialog
      v-model="editDialog"
      :item="editItem"
      @saved="onEditSaved"
      @error="onEditError"
    ></episode-edit-dialog>
  </v-container>
</template>

<style scoped lang="sass"></style>
