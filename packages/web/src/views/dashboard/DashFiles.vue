<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12">
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
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="files?.total ?? 0"
        :items="files?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((files?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
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

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.file') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.name }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="fileDeleting" @click="deleteFile(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { mdiDelete, mdiDownload, mdiMagnify, mdiRefresh } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { FileEntity, FileQueryDto } from '@/api/interfaces/file.interface';
import { useToastStore } from '@/store/toast';
import { filesize } from 'filesize';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<FileQueryDto>({});
const {
  pending: loading,
  request,
  data: files,
} = useAxiosRequest(async () => {
  return await api.File.query({
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
    title: t('file.entity.name'),
    key: 'name',
  },
  {
    title: t('file.entity.size'),
    key: 'size',
    value: (row: any) => row.size && filesize(row.size, {}),
  },
  {
    title: t('file.entity.mimetype'),
    key: 'mimetype',
    sortable: false,
  },
  {
    title: t('file.entity.source'),
    key: 'source',
    value: (row: any) => t(`file.source.${row.source ?? 'other'}`),
  },
  {
    title: t('file.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<FileEntity | undefined>(undefined);

const deleteDialog = ref(false);
const {
  pending: fileDeleting,
  request: deleteFile,
  onResolved: onFileDeleted,
  onRejected: onFileDeleteFailed,
} = useAxiosRequest(async (id: string) => {
  return await api.File.delete(id)();
});
onFileDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (files.value) {
    files.value.items = files.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onFileDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.download'),
    icon: mdiDownload,
    color: 'info',
    show: (item: FileEntity) => true,
    click: (item: FileEntity) => {
      const el = document.createElement('a');
      el.href = api.File.buildDownloadPath(item.id, item.name);
      el.click();
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: FileEntity) => true,
    click: (item: FileEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
