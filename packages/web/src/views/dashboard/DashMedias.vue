<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiUpload" @click="layout.uploadDrawer = true">
          {{ t('app.actions.upload') }}
        </v-btn>
      </v-col>
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
        :items-length="medias?.total ?? 0"
        :items="medias?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((medias?.total ?? 0) / size) })"
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
        <template #item.poster="{ item }">
          <zoom-img
            class="rounded ma-1"
            :aspect-ratio="16 / 9"
            min-width="120"
            max-width="160"
            :src="item.poster ? api.File.buildRawPath(item.poster.id, item.poster.name) : MediaPosterFallback"
          ></zoom-img>
        </template>
        <template #item.isPublic="{ item }">
          <v-icon size="small" :icon="item.isPublic ? mdiCheck : mdiClose"></v-icon>
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
      :fullscreen="!display.smAndUp.value"
      v-model="editDialog"
      scrollable
    >
      <v-card v-if="editItem">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="editDialog = false"></v-btn>
          <v-toolbar-title> {{ t('app.actions.edit') }} {{ t('app.entities.media') }}</v-toolbar-title>
          <v-btn
            variant="text"
            :disabled="!(editItem.name?.length > 0)"
            :prepend-icon="mdiCheck"
            :loading="mediaUpdating"
            @click="updateMedia(editItem)"
          >
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-6">
          <v-container class="pa-0">
            <span class="text-body-1 font-weight-bold">
              {{ t('media.entity.name') }}
            </span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="editItem.name"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">
              {{ t('media.entity.description') }}
            </span>
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
            <v-switch inset hide-details color="primary" density="compact" v-model="editItem.isPublic">
              <template #prepend>
                <span class="text-body-1 font-weight-bold">{{ t('media.entity.isPublic') }}</span>
              </template>
            </v-switch>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">
              {{ t('media.entity.poster') }}
            </span>
            <v-row class="mt-1">
              <v-col cols="12" md="8">
                <zoom-img
                  class="rounded"
                  :src="editItem.poster && api.File.buildRawPath(editItem.poster.id)"
                ></zoom-img>
                <v-btn
                  class="mt-2"
                  :prepend-icon="mdiCloudUploadOutline"
                  color="warning"
                  variant="tonal"
                  block
                  :loading="posterUploading"
                  @click="selectAndUploadPoster()"
                >
                  {{ t('app.actions.upload') }}
                </v-btn>
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
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.media') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.name || editItem.file?.name }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="mediaDeleting" @click="deleteMedia(editItem!.id)">
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
  mdiRefresh,
  mdiShare,
  mdiUpload,
} from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce, selectFile } from '@/utils/utils';
import { MediaEntity, MediaQueryDto } from '@/api/interfaces/media.interface';
import MediaPosterFallback from '@/assets/banner.jpeg';
import ZoomImg from '@/components/app/ZoomImg.vue';
import ExpandableText from '@/components/app/ExpandableText.vue';
import { useLayoutStore } from '@/store/layout';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import { useDisplay } from 'vuetify';

const { t, locale } = useI18n();
const api = useApiStore();
const layout = useLayoutStore();
const display = useDisplay();
const router = useRouter();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<MediaQueryDto>({});
const {
  pending: loading,
  request,
  data: medias,
} = useAxiosRequest(async () => {
  return await api.Media.query({
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
    title: t('media.entity.name'),
    key: 'name',
  },
  {
    title: t('media.entity.poster'),
    key: 'poster',
    sortable: false,
  },
  {
    title: t('media.entity.isPublic'),
    key: 'isPublic',
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

const editItem = ref<MediaEntity | undefined>(undefined);

const editDialog = ref(false);
const {
  pending: mediaUpdating,
  request: updateMedia,
  onResolved: onMediaUpdated,
  onRejected: onMediaUpdateFailed,
} = useAxiosRequest(async (media: MediaEntity) => {
  return await api.Media.update(media.id)({
    name: media.name,
    description: media.description,
    isPublic: media.isPublic,
    posterFileId: media.poster?.id,
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
onMediaUpdated((data) => {
  const index = medias.value?.items.findIndex(({ id }) => id === data.id) ?? -1;
  if (index > -1) {
    medias.value!.items[index] = data;
  }
  editDialog.value = false;
});
onMediaUpdateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: mediaDeleting,
  request: deleteMedia,
  onResolved: onMediaDeleted,
  onRejected: onMediaDeleteFailed,
} = useAxiosRequest(async (id: string) => {
  return await api.Media.delete(id)();
});
onMediaDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (medias.value) {
    medias.value.items = medias.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onMediaDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.view'),
    icon: mdiShare,
    color: 'info',
    show: (item: MediaEntity) => true,
    click: (item: MediaEntity) => {
      router.push({ path: `/media/${item.id}` });
    },
  },
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: MediaEntity) => true,
    click: (item: MediaEntity) => {
      editItem.value = Object.assign({}, item);
      editDialog.value = true;
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: MediaEntity) => true,
    click: (item: MediaEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
