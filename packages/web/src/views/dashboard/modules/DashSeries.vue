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
        :items-length="total"
        :items="seriesData?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((seriesData?.total ?? 0) / size) })"
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
              <v-container fluid class="d-flex flex-column">
                <expandable-text
                  class="text-subtitle-2"
                  :content="item.description || t('resource.noDescription')"
                ></expandable-text>
              </v-container>
            </td>
          </tr>
        </template>
        <template #item.finished="{ item }">
          <v-icon size="small" :icon="item.finished ? mdiCheck : mdiClose"></v-icon>
        </template>
        <template #item.poster="{ item }">
          <div class="d-block">
            <zoom-img
              class="rounded ma-1"
              :aspect-ratio="3 / 4"
              min-width="60"
              max-width="100"
              :src="item.poster ? api.File.buildRawPath(item.poster) : SeriesPosterFallback"
            ></zoom-img>
          </div>
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
      v-model="editDialog"
      scrollable
    >
      <v-card v-if="editItem">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="editDialog = false"></v-btn>
          <v-toolbar-title>
            {{ editItem?.id ? t('app.actions.edit') : t('app.actions.add') }}
            {{ t('app.entities.series') }}
          </v-toolbar-title>
          <v-btn
            variant="text"
            :disabled="!(editItem.name?.length > 0)"
            :prepend-icon="mdiCheck"
            :loading="seriesSaving"
            @click="saveSeries(editItem)"
          >
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-6">
          <v-container class="pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('series.entity.name') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model.trim="editItem.name"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('series.entity.season') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model.trim="editItem.season"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.pubAt') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="editItem.pubAt"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('series.entity.description') }}</span>
            <v-textarea
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              rows="3"
              v-model="editItem.description"
            ></v-textarea>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('series.entity.count') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              type="number"
              v-model.number="editItem.count"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <v-checkbox hide-details color="primary" density="compact" v-model="editItem.finished">
              <template #prepend>
                <span class="text-body-1 font-weight-bold">{{ t('series.entity.finished') }}</span>
              </template>
            </v-checkbox>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">
              {{ t('series.entity.tags') }}
            </span>
            <v-autocomplete
              :readonly="tagSaving"
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              return-object
              chips
              closable-chips
              clearable
              :loading="tagsLoading"
              hide-no-data
              item-title="name"
              density="compact"
              :items="tags"
              multiple
              v-model="editItem.tags"
              v-model:search.trim="searchTag"
              @focus.once="queryTags()"
              @keydown.enter="saveTag(searchTag)"
            >
              <template #append-inner>
                <v-progress-circular v-if="tagSaving" indeterminate color="primary"></v-progress-circular>
              </template>
            </v-autocomplete>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">
              {{ t('series.entity.poster') }}
            </span>
            <v-row class="mt-1">
              <v-col cols="12" md="4">
                <zoom-img
                  :aspect-ratio="1 / 1.4"
                  min-width="80"
                  class="rounded"
                  :src="editItem.poster ? api.File.buildRawPath(editItem.poster) : SeriesPosterFallback"
                ></zoom-img>
                <v-btn
                  class="mt-2"
                  :prepend-icon="mdiCloudUploadOutline"
                  color="warning"
                  :text="t('app.actions.upload')"
                  variant="tonal"
                  block
                  :loading="posterUploading"
                  @click="selectAndUploadPoster"
                ></v-btn>
              </v-col>
            </v-row>
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
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.series') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.name }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="seriesDeleting" @click="deleteSeries(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import {
  mdiCheck,
  mdiClose,
  mdiCloudUploadOutline,
  mdiDelete,
  mdiMagnify,
  mdiPencil,
  mdiPlus,
  mdiRefresh,
  mdiShare,
} from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { computed, ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce, selectFile } from '@/utils/utils';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { SeriesEntity, SeriesQueryDto } from '@/api/interfaces/series.interface';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import ExpandableText from '@/components/app/ExpandableText.vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import { useDisplay } from 'vuetify';

const { t, locale } = useI18n();
const api = useApiStore();
const display = useDisplay();
const router = useRouter();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([{ key: 'createAt', order: 'DESC' }]);
const total = ref(0);
const filters = ref<SeriesQueryDto>({});
const {
  pending: loading,
  request,
  data: seriesData,
  onResolved: onSeriesLoaded,
} = useAxiosRequest(async () => {
  return await api.Series.query({
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
onSeriesLoaded((data) => {
  total.value = data.total;
});
const useQuery = debounce(request, 1000);

const headers = ref([
  {
    title: t('series.entity.name'),
    key: 'name',
  },
  {
    title: t('series.entity.season'),
    key: 'season',
  },
  {
    title: t('series.entity.pubAt'),
    key: 'pubAt',
    value: (row: any) => new Date(row.pubAt).toLocaleDateString(locale.value),
  },
  {
    title: t('series.entity.count'),
    key: 'count',
    value: (row: any) => row.count || t('app.unknown'),
  },
  {
    title: t('series.entity.finished'),
    key: 'finished',
  },
  {
    title: t('series.entity.poster'),
    key: 'poster',
    sortable: false,
  },
  {
    title: t('rule.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<SeriesEntity>();

const editDialog = ref(false);
const createNew = () => {
  editItem.value = { tags: [] } as any;
  editDialog.value = true;
};
const {
  pending: seriesSaving,
  request: saveSeries,
  onResolved: onSeriesSaved,
  onRejected: onSeriesSaveFailed,
} = useAxiosRequest(async (series: SeriesEntity) => {
  const handler = series.id ? api.Series.update(series.id) : api.Series.create;
  return handler({
    name: series.name,
    season: series.season,
    pubAt: series.pubAt,
    description: series.description,
    count: series.count,
    finished: series.finished,
    tags: (series.tags ?? []).map(({ name }) => name),
    posterFileId: series.poster?.id,
  });
});
const posterUploading = ref(false);
const selectAndUploadPoster = async () => {
  selectFile('image/*', false, async (files) => {
    if (editItem.value) {
      posterUploading.value = true;
      try {
        const response = await api.File.uploadImage(files[0]);
        editItem.value.poster = response.data;
      } catch (error: any) {
        toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
      } finally {
        posterUploading.value = false;
      }
    }
  });
};
onSeriesSaved((data) => {
  if (seriesData.value) {
    const index = seriesData.value?.items.findIndex(({ id }) => id === data.id) ?? -1;
    if (index > -1) {
      seriesData.value.items[index] = data;
    } else {
      seriesData.value.items.unshift(data);
    }
  }

  editDialog.value = false;
});
onSeriesSaveFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
const searchTag = ref('');
const {
  pending: tagsLoading,
  request: queryTags,
  data: tagsData,
  onRejected: onTagsLoadFailed,
} = useAxiosRequest(async () => {
  return await api.SeriesTag.query({ keyword: searchTag.value || undefined, size: 1024 });
});
const tags = computed(() => tagsData.value?.items);
onTagsLoadFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
const {
  pending: tagSaving,
  request: saveTag,
  onResolved: onTagSaved,
  onRejected: onTagSaveFailed,
} = useAxiosRequest(async (name: string) => {
  return await api.SeriesTag.create({ name });
});
onTagSaved((data) => {
  if (editItem.value) {
    if (!editItem.value.tags.some(({ name }) => name === data.name)) {
      editItem.value.tags.push(data);
    }
  }
  searchTag.value = '';
});
onTagSaveFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: seriesDeleting,
  request: deleteSeries,
  onResolved: onSeriesDeleted,
  onRejected: onSeriesDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Series.delete(id)();
});
onSeriesDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (seriesData.value) {
    seriesData.value.items = seriesData.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onSeriesDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.view'),
    icon: mdiShare,
    color: 'info',
    show: (item: SeriesEntity) => true,
    click: (item: SeriesEntity) => {
      router.push({ path: `/series/${item.id}` });
    },
  },
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: SeriesEntity) => true,
    click: (item: SeriesEntity) => {
      editItem.value = Object.assign({}, item);
      editDialog.value = true;
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: SeriesEntity) => true,
    click: (item: SeriesEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
