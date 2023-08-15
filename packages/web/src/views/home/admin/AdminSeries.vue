<script setup lang="ts">
import { useApp } from '@/store/app';
import { ref, watch } from 'vue';
import { Api } from '@/api/api';
import { SeriesEntity, SeriesQueryDto } from '@/interfaces/series.interface';
import {
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiDelete,
  mdiMultimedia,
  mdiPencil,
  mdiPlus,
  mdiRefresh,
  mdiShare,
} from '@mdi/js';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import { useDisplay } from 'vuetify';
import ViewImg from '@/components/provider/ViewImg.vue';
import UserAvatar from '@/components/provider/UserAvatar.vue';
import SeriesEditDialog from '@/components/edit/SeriesEditDialog.vue';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const items = ref<SeriesEntity[]>([]);
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
    title: '名称',
    key: 'name',
  },
  {
    title: '海报图',
    key: 'poster',
    sortable: false,
  },
  {
    title: '水平海报图',
    key: 'posterLandscape',
    sortable: false,
  },
  {
    title: '创建用户',
    key: 'user',
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
    const response = await Api.Series.query({
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
    app.toastError('获取剧集列表失败');
  } finally {
    loading.value = false;
  }
};

const expand = ref(false);
const edit = ref<SeriesQueryDto>({});
watch(
  () => [route.path, route.query],
  (newValue, oldValue) => {
    if (newValue[0] !== oldValue?.[0] && route.name === 'admin-series') {
      edit.value = Object.assign({}, route.query);
      options.value.page = 1;
    }
  },
  { immediate: true },
);
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.name === 'admin-series') {
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
    await Api.Series.delete(id)();
    items.value = items.value.filter(({ id: val }) => val !== id);
    app.toastSuccess('删除剧集成功');
  } catch {
    app.toastError('删除剧集失败');
  } finally {
    loading.value = false;
  }
};

const editDialog = ref(false);
const editItem = ref<SeriesEntity>({} as any);
const openEdit = (item?: SeriesEntity) => {
  editItem.value = Object.assign({}, item);
  editDialog.value = true;
};
const onEditSaved = (data: SeriesEntity) => {
  const index = items.value.findIndex(({ id }) => id === data.id);
  if (index > -1) {
    items.value[index] = data;
  } else {
    items.value.unshift(data);
  }
  app.toastSuccess('保存剧集信息成功');
};
const onEditError = (error: any) => {
  if (error?.response?.data?.code === ErrorCodeEnum.DUPLICATE_SERIES_NAME) {
    app.toastError('已存在同名剧集');
  } else {
    app.toastError('保存剧集信息失败');
  }
};
</script>

<template>
  <v-container fluid class="py-4 px-6">
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiMultimedia"></v-icon>
        <span class="ml-4 text-h5">剧集管理</span>
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
            <v-col cols="12">
              <v-text-field
                v-model.number="edit.id"
                type="number"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="剧集ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="edit.name"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="剧集名称(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="edit.userId"
                type="number"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="剧集创建用户ID(精确查询)"
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
          expand-on-click
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
          <template #expanded-row="{ item }">
            <tr>
              <td :colspan="headers.length">
                <v-container fluid>
                  <v-row>
                    <v-col cols="12" sm="6" class="d-flex rounded border">
                      <span class="text-subtitle-2 font-weight-bold">单集列表</span>
                    </v-col>
                    <v-col cols="12" sm="6" class="d-flex flex-column">
                      <span class="text-subtitle-2 font-weight-bold">剧集描述</span>
                      <pre
                        class="text-caption mt-1 text-pre-wrap text-break"
                        v-text="item.raw.description || '暂无剧集描述'"
                      ></pre>
                      <span class="text-subtitle-2 font-weight-bold mt-2">剧集标签</span>
                      <div>
                        <span v-if="item.raw.tags?.length === 0" class="text-caption mt-1">无</span>
                        <v-chip
                          density="compact"
                          v-for="tag in item.raw.tags ?? []"
                          :key="tag!.id"
                          label
                          color="primary"
                          class="me-2 my-1 text-caption"
                          :text="tag.name"
                        ></v-chip>
                      </div>
                    </v-col>
                  </v-row>
                </v-container>
              </td>
            </tr>
          </template>
          <template #item.poster="{ item }">
            <v-container class="pa-1">
              <view-img
                :aspect-ratio="3 / 4"
                min-width="32"
                max-width="64"
                :src="item.raw.poster ? Api.File.buildRawPath(item.raw.poster.id) : SeriesCoverFallback"
              ></view-img>
            </v-container>
          </template>
          <template #item.posterLandscape="{ item }">
            <v-container class="pa-1">
              <view-img
                min-width="80"
                max-width="120"
                :src="
                  item.raw.posterLandscape ? Api.File.buildRawPath(item.raw.posterLandscape.id) : MediaCoverFallback
                "
              ></view-img>
            </v-container>
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
                text="转到"
                :icon="mdiShare"
                size="small"
                color="primary"
                variant="tonal"
                @click.stop="router.push(`/series/${item.raw.id}`)"
              ></action-btn>
              <action-btn
                class="ms-1"
                text="编辑"
                :icon="mdiPencil"
                size="small"
                color="secondary"
                variant="tonal"
                @click.stop="openEdit(item.raw)"
              ></action-btn>
              <v-menu>
                <template #activator="{ props }">
                  <action-btn
                    class="ms-1"
                    v-bind="props"
                    text="删除"
                    :icon="mdiDelete"
                    size="small"
                    color="error"
                    variant="tonal"
                  ></action-btn>
                </template>
                <v-card>
                  <v-card-title>删除确认</v-card-title>
                  <v-card-text>确定要删除该剧集吗？该操作不可撤销！</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="text">取消</v-btn>
                    <v-btn color="error" variant="plain" @click="deleteItem(item.raw.id)">确定</v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-container>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
    <series-edit-dialog v-model="editDialog" :item="editItem" @saved="onEditSaved" @error="onEditError">
    </series-edit-dialog>
  </v-container>
</template>

<style scoped lang="sass"></style>
