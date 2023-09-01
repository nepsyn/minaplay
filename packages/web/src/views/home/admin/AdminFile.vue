<script setup lang="ts">
import { useApp } from '@/store/app';
import { ref } from 'vue';
import { Api } from '@/api/api';
import {
  mdiCheck,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiDelete,
  mdiDownload,
  mdiFileMultiple,
  mdiRefresh,
} from '@mdi/js';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { useDisplay } from 'vuetify';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { FileEntity, FileQueryDto } from '@/interfaces/file.interface';
import { filesize } from 'filesize';
import { FileSourceEnum } from '@/api/enums/file-source.enum';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const items = ref<FileEntity[]>([]);
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
    title: '大小',
    key: 'size',
  },
  {
    title: '来源',
    key: 'source',
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
    const response = await Api.File.query({
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
    app.toastError('获取文件列表失败');
  } finally {
    loading.value = false;
  }
};

const getSourceText = (source: FileSourceEnum) => {
  switch (source) {
    case FileSourceEnum.USER_UPLOAD:
      return '用户上传';
    case FileSourceEnum.ARIA2_DOWNLOAD:
      return '自动下载';
    case FileSourceEnum.AUTO_GENERATED:
      return '自动生成';
  }
};

const expand = ref(false);
const edit = ref<FileQueryDto>({});
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.name === 'admin-file') {
    edit.value = Object.assign({}, to.query);
    options.value.page = 1;
    await loadItems(options.value);
  }
  next();
});
const reset = async () => {
  edit.value = {};
};

const deleteItem = async (id: string) => {
  loading.value = true;
  try {
    await Api.File.delete(id)();
    items.value = items.value.filter(({ id: val }) => val !== id);
    app.toastSuccess('删除文件成功');
  } catch {
    app.toastError('删除文件失败');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="d-flex align-center">
      <v-container fluid class="pa-0 d-flex align-center">
        <v-icon size="40" color="primary" :icon="mdiFileMultiple"></v-icon>
        <span class="ml-4 text-h5">文件管理</span>
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
                label="文件ID(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.trim="edit.md5"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="文件MD5(精确查询)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="edit.source"
                :items="[
                  { title: '用户上传', value: FileSourceEnum.USER_UPLOAD },
                  { title: '自动下载', value: FileSourceEnum.ARIA2_DOWNLOAD },
                  { title: '自动生成', value: FileSourceEnum.AUTO_GENERATED },
                ]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="文件来源(精确查询)"
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
                label="上传用户ID(精确查询)"
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
                  <span class="text-caption">
                    <span class="font-weight-bold">MD5:</span>
                    {{ item.raw.md5 }}
                  </span>
                  <span class="text-caption ms-4">
                    <span class="font-weight-bold">MIMETYPE:</span>
                    {{ item.raw.mimetype }}
                  </span>
                </v-container>
              </td>
            </tr>
          </template>
          <template #item.size="{ item }">
            {{ filesize(item.raw.size, { base: 2, standard: 'jedec' }) }}
          </template>
          <template #item.source="{ item }">
            {{ getSourceText(item.raw.source) }}
          </template>
          <template #item.createAt="{ item }">
            {{ new Date(item.raw.createAt).toLocaleString() }}
          </template>
          <template #item.actions="{ item }">
            <v-container fluid class="pa-0 d-flex flex-row">
              <action-btn
                text="下载"
                :icon="mdiDownload"
                size="small"
                color="primary"
                variant="tonal"
                :href="Api.File.buildDownloadPath(item.raw.id)"
                download
                @click.stop
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
                  <v-card-text>确定要删除该文件吗？该操作不可撤销！</v-card-text>
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
  </v-container>
</template>

<style scoped lang="sass"></style>
