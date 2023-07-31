<script setup lang="ts">
import { useApp } from '@/store/app';
import { ref } from 'vue';
import { Api } from '@/api/api';
import { MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import {
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiCloudUploadOutline,
  mdiDelete,
  mdiFileVideo,
  mdiPencil,
  mdiRefresh,
} from '@mdi/js';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import ViewImg from '@/components/provider/ViewImg.vue';
import MediaEditDialog from '@/components/edit/MediaEditDialog.vue';

const app = useApp();
const router = useRouter();
const display = useDisplay();

const items = ref<MediaEntity[]>([]);
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
    key: 'name',
  },
  {
    title: '海报图',
    key: 'poster',
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
    const response = await Api.Media.query({
      ...query.value,
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

const edit = ref<MediaQueryDto>({});
const query = ref<MediaQueryDto>({});
const expand = ref(false);
const reset = async () => {
  edit.value = {};
};
const useQuery = async () => {
  query.value = Object.assign(
    {},
    Object.fromEntries(Object.entries(edit.value).map(([key, value]) => [key, value || undefined])),
  );
  options.value.page = 1;
  await loadItems(options.value);
};

const deleteItem = async (id: string) => {
  loading.value = true;
  try {
    await Api.Media.delete(id)();
    items.value = items.value.filter(({ id: val }) => val !== id);
    app.toastSuccess('删除媒体文件成功');
  } catch {
    app.toastError('删除媒体文件失败');
  } finally {
    loading.value = false;
  }
};

const getFiles = (item: MediaEntity) => {
  return [item.file]
    .concat([item.poster])
    .concat(item.subtitles)
    .concat(item.attachments)
    .filter((v) => v != undefined);
};
const openUrl = (url: string) => {
  window.open(url);
};

const editDialog = ref(false);
const editItem = ref<MediaEntity>({} as any);
const openEdit = (item: MediaEntity) => {
  editItem.value = Object.assign(
    {
      name: undefined,
      description: undefined,
      poster: undefined,
    },
    item,
  );
  editDialog.value = true;
};
const onEditSaved = (data: MediaEntity) => {
  const index = items.value.findIndex(({ id }) => id === editItem.value!.id);
  if (index > -1) {
    items.value[index] = data;
  }
  editDialog.value = false;
  app.toastSuccess('保存媒体文件信息成功');
};
const onEditError = (error: any) => {
  app.toastError('保存媒体文件信息失败');
};
</script>

<template>
  <v-container>
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiFileVideo"></v-icon>
        <span class="ml-4 text-h5">媒体文件管理</span>
      </v-container>
      <v-spacer></v-spacer>
      <action-btn
        color="warning"
        :icon="mdiCloudUploadOutline"
        text="上传"
        @click="app.uploadDrawer = true"
      ></action-btn>
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
                v-model.trim="edit.id"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="媒体文件ID(精确查询)"
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
                    <v-col cols="12" sm="6" class="border rounded d-flex align-center justify-center">
                      <media-overview-landscape
                        :media="item.raw"
                        @click:content="router.push(`/media/${item.raw.id}`)"
                      ></media-overview-landscape>
                    </v-col>
                    <v-col cols="12" sm="6" class="d-flex flex-column">
                      <span class="text-subtitle-2 font-weight-bold">媒体文件描述</span>
                      <pre
                        class="text-caption mt-1 text-pre-wrap text-break"
                        v-text="item.raw.description || '暂无媒体文件描述'"
                      ></pre>
                      <span class="text-subtitle-2 font-weight-bold mt-2">文件列表</span>
                      <div>
                        <span
                          class="me-2 text-caption text-primary text-decoration-underline clickable text-break"
                          v-for="file in getFiles(item.raw)"
                          :key="file!.id"
                          @click="openUrl(Api.File.buildDownloadPath(file!.id))"
                        >
                          {{ file.name }}
                        </span>
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
                min-width="80"
                max-width="120"
                :src="item.raw.poster ? Api.File.buildRawPath(item.raw.poster.id) : MediaCoverFallback"
              ></view-img>
            </v-container>
          </template>
          <template #item.createAt="{ item }">
            {{ new Date(item.raw.createAt).toLocaleString() }}
          </template>
          <template #item.actions="{ item }">
            <v-container fluid class="pa-0 d-flex flex-row">
              <action-btn
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
                  <v-card-text>确定要删除该媒体文件吗？该操作不可撤销！</v-card-text>
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
    <media-edit-dialog
      v-model="editDialog"
      :item="editItem"
      @saved="onEditSaved"
      @error="onEditError"
    ></media-edit-dialog>
  </v-container>
</template>

<style scoped lang="sass"></style>
