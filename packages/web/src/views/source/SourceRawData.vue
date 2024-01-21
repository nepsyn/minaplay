<template>
  <v-container class="pa-0 flex-grow-1 d-flex flex-column">
    <span class="text-h4">{{ t('source.sections.raw') }}</span>
    <v-row dense class="flex-grow-0 py-2 mt-3">
      <v-col cols="12" sm="auto" class="flex-grow-1">
        <v-btn-toggle border v-model="tab" mandatory divided density="comfortable" color="primary">
          <v-btn variant="text" :prepend-icon="mdiFormatListNumbered">
            {{ t('source.raw.parsedView') }}
          </v-btn>
          <v-btn variant="text" :prepend-icon="mdiCodeJson">
            {{ t('source.raw.rawView') }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
      <v-col cols="12" sm="auto" class="flex-grow-0">
        <v-btn
          variant="flat"
          color="info"
          height="40"
          block
          :prepend-icon="mdiRefresh"
          :loading="rawDataLoader.pending.value"
          @click="rawDataLoader.request()"
        >
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-2"></v-divider>
    <single-item-loader class="px-0 py-2 flex-grow-1 d-flex flex-column" :loader="rawDataLoader" lazy>
      <v-slide-x-reverse-transition leave-absolute>
        <v-container class="pa-0 mt-2 d-flex flex-column" v-if="tab === 0">
          <v-alert variant="tonal" color="warning-darken-1">
            <template #prepend>
              <v-icon size="x-large">
                <v-img cover :src="getFaviconUrl(rawData!.link ?? '')" aspect-ratio="1">
                  <template #placeholder>
                    <v-img :src="BlankFavicon" aspect-ratio="1"></v-img>
                  </template>
                </v-img>
              </v-icon>
            </template>
            <v-container class="pa-0 d-flex flex-column">
              <span class="text-h6">
                {{ rawData?.title ?? t('source.unnamed') }}
              </span>
              <span class="text-body-1">
                {{ rawData?.description ?? '' }}
              </span>
              <div v-if="rawData?.link" class="d-flex flex-row mt-1">
                <v-spacer></v-spacer>
                <v-btn @click="openUrl(rawData.link)" variant="tonal" color="primary">
                  {{ t('source.raw.visit') }}
                </v-btn>
              </div>
            </v-container>
          </v-alert>
          <v-text-field
            :label="t('app.input.keyword')"
            class="flex-grow-0 mt-4"
            v-model.trim="search"
            variant="outlined"
            clearable
            hide-details
            density="compact"
          ></v-text-field>
          <v-data-iterator
            :search="search"
            filter-keys="title"
            :items="rawData?.entries ?? []"
            :page="page"
            items-per-page="5"
            class="mt-4"
          >
            <template #default="{ items }">
              <v-divider></v-divider>
              <template v-for="(item, index) in items" :key="index">
                <v-list-item class="px-0 py-2">
                  <template #append>
                    <div class="ml-2">
                      <div class="d-none d-sm-flex flex-row">
                        <template v-for="(action, index) in actions" :key="index">
                          <div v-if="action.show(item.raw)">
                            <v-tooltip>
                              {{ action.name }}
                              <template #activator="{ props }">
                                <v-btn
                                  v-bind="props"
                                  size="small"
                                  density="comfortable"
                                  variant="text"
                                  :icon="action.icon"
                                  @click="action.click(item.raw)"
                                  :loading="action.key === 'download' && downloadCreating && currentEntry === item.raw"
                                  :disabled="action.key === 'download' && downloadCreating && currentEntry !== item.raw"
                                >
                                </v-btn>
                              </template>
                            </v-tooltip>
                          </div>
                        </template>
                      </div>
                      <v-menu>
                        <v-list density="comfortable">
                          <template v-for="(action, index) in actions" :key="index">
                            <v-list-item
                              density="compact"
                              link
                              v-if="action.show(item.raw)"
                              :prepend-icon="action.icon"
                              @click="action.click(item.raw)"
                              :title="action.name"
                              :disabled="action.key === 'download' && downloadCreating"
                            >
                            </v-list-item>
                          </template>
                        </v-list>
                        <template #activator="{ props }">
                          <v-btn
                            class="d-flex d-sm-none"
                            v-bind="props"
                            size="small"
                            density="comfortable"
                            variant="text"
                            :icon="mdiDotsVertical"
                          ></v-btn>
                        </template>
                      </v-menu>
                    </div>
                  </template>
                  <v-list-item-title>
                    <pre class="text-body-1 text-break text-pre-wrap">{{ item.raw.title ?? item.raw.id }}</pre>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="item.raw.published">
                    {{ `${t('source.raw.publishAt')} ${new Date(item.raw.published).toLocaleString(locale)}` }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider></v-divider>
              </template>
            </template>
            <template #footer="{ page, pageCount, setPage, prevPage, nextPage }">
              <v-pagination
                class="my-2"
                density="comfortable"
                :model-value="page"
                @update:model-value="setPage"
                @prev="prevPage"
                @next="nextPage"
                :length="pageCount"
              ></v-pagination>
            </template>
          </v-data-iterator>
        </v-container>
        <monaco-editor
          v-else
          :value="rawDataText"
          language="json"
          readonly
          class="flex-grow-1 border rounded"
        ></monaco-editor>
      </v-slide-x-reverse-transition>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';
import MonacoEditor from '@/components/app/MonacoEditor.vue';
import {
  mdiCodeJson,
  mdiContentCopy,
  mdiDotsVertical,
  mdiDownload,
  mdiFormatListNumbered,
  mdiOpenInNew,
  mdiRefresh,
} from '@mdi/js';
import BlankFavicon from '@/assets/blank-favicon.png';
import { copyContent, openUrl } from '@/utils/utils';
import { FeedEntry } from '@/api/interfaces/subscribe.interface';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const toast = useToastStore();

const rawDataLoader = useAxiosRequest(async () => {
  return await api.Source.fetchRawData(Number(route.params.id))();
});
const rawData = computed(() => rawDataLoader.data.value);
const rawDataText = computed(() => (rawData.value ? JSON.stringify(rawData.value, null, 2) : ''));

const tab = ref(0);
const page = ref(1);
const search = ref('');

const currentEntry = ref<FeedEntry | undefined>(undefined);
const {
  pending: downloadCreating,
  request: createDownload,
  onResolved: onDownloadCreated,
  onRejected: onDownloadCreateFailed,
} = useAxiosRequest(async (entry: FeedEntry) => {
  currentEntry.value = entry;
  return await api.Download.create({
    name: entry.title ?? entry.id,
    url: entry.enclosure.url,
    sourceId: Number(route.params.id),
  });
});
onDownloadCreated(() => {
  toast.toastSuccess(t('source.raw.downloadCreated'));
});
onDownloadCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    key: 'download',
    name: t('source.raw.download'),
    icon: mdiDownload,
    show: (item: FeedEntry) => item.enclosure?.url,
    click: (item: FeedEntry) => createDownload(item),
  },
  {
    key: 'copyLink',
    name: t('source.raw.copyLink'),
    icon: mdiContentCopy,
    show: (item: FeedEntry) => item.enclosure?.url,
    click: (item: FeedEntry) => {
      copyContent(item.enclosure.url)
        .then(() => {
          toast.toastSuccess(t('source.raw.linkCopied'));
        })
        .catch(() => {
          toast.toastError(t('source.raw.linkCopyFailed'));
        });
    },
  },
  {
    key: 'openPage',
    name: t('source.raw.openPage'),
    icon: mdiOpenInNew,
    show: (item: FeedEntry) => item?.link,
    click: (item: FeedEntry) => openUrl(item.link!),
  },
];

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return '://favicon.ico';
  }
};
</script>

<style scoped lang="sass"></style>
