<script setup lang="ts">
import { useApp } from '@/store/app';
import { ref } from 'vue';
import { Api } from '@/api/api';
import { SeriesEntity, SeriesQueryDto } from '@/interfaces/series.interface';
import { mdiCheck, mdiChevronDown, mdiChevronUp, mdiClose, mdiMultimedia } from '@mdi/js';
import { VDataTableServer } from 'vuetify/labs/components';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const app = useApp();

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
    title: '描述',
    key: 'description',
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
    title: '标签',
    key: 'tags',
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
    const response = await Api.Series.query({
      ...query.value,
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

const edit = ref<SeriesQueryDto>({
  keyword: undefined,
  name: undefined,
});
const query = ref<SeriesQueryDto>();
const expand = ref(false);
const reset = async () => {
  edit.value.keyword = undefined;
  edit.value.name = undefined;
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
        <v-icon size="40" color="primary" :icon="mdiMultimedia"></v-icon>
        <span class="ml-4 text-h5">剧集管理</span>
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
                v-model.trim="edit.name"
                variant="outlined"
                density="compact"
                color="primary"
                hide-details
                label="剧集名称(精确查询)"
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
          item-value="name"
          @update:options="loadItems"
          density="compact"
          class="text-caption font-weight-bold"
        >
          <template #bottom>
            <v-divider></v-divider>
            <v-container fluid class="py-1 px-2 d-flex flex-row align-center">
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
          <template #item.poster="{ item }"> TODO poster</template>
          <template #item.posterLandscape="{ item }"> TODO poster landscape</template>
          <template #item.tags="{ item }"> TODO tags</template>
          <template #item.actions="{ item }">
            <v-btn variant="tonal" color="warning" text="修改权限" size="small"></v-btn>
          </template>
        </v-data-table-server>
      </v-sheet>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
