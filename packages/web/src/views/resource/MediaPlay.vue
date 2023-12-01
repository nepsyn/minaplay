<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <v-row>
        <v-col cols="12" md="8">
          <single-item-loader class="pa-0" :loader="mediaLoader">
            <v-responsive class="rounded-lg" :aspect-ratio="16 / 9" max-height="520">
              <video-player :media="media!"></video-player>
            </v-responsive>
            <v-container fluid class="pa-0 mt-4 d-flex flex-column">
              <span class="text-h6 text-wrap">{{ media!.name }}</span>
              <v-container fluid class="pa-0 mt-2 d-flex flex-row align-center">
                <span class="text-caption">
                  {{ new Date(media!.createAt).toLocaleString(locale) }}
                </span>
                <v-spacer></v-spacer>
                <div v-for="(action, index) in actions" :key="index">
                  <v-btn
                    density="comfortable"
                    size="small"
                    :color="action.color"
                    :icon="action.icon"
                    @click="action.click()"
                    variant="text"
                  ></v-btn>
                  <v-tooltip location="bottom" activator="parent">{{ action.text }}</v-tooltip>
                </div>
              </v-container>
              <v-divider class="my-2"></v-divider>
              <pre
                style="min-height: 100px"
                class="text-subtitle-2 font-weight-light text-pre-wrap text-break bg-transparent"
                v-text="media!.description ?? t('resource.noDescription')"
              ></pre>
            </v-container>
          </single-item-loader>
        </v-col>
        <v-col cols="12" md="4">
          <multi-items-loader class="pa-0" :loader="recommendsLoader" :hide-empty="recommends.length > 0" auto>
            <div class="d-flex align-center mb-4">
              <v-icon :icon="mdiMultimedia" size="large"></v-icon>
              <span class="text-h6 ml-3">{{ t('resource.medias') }}</span>
            </div>
            <template v-for="recommend in recommends" :key="recommend.id">
              <media-overview-landscape
                @click="router.push({ path: `/media/${recommend.id}` })"
                v-if="recommend.id !== media?.id"
                class="my-3"
                :media="recommend"
              ></media-overview-landscape>
            </template>
          </multi-items-loader>
        </v-col>
      </v-row>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import VideoPlayer from '@/components/app/VideoPlayer.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { mdiContentCopy, mdiMotionPlayOutline, mdiMultimedia, mdiVlc } from '@mdi/js';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import { copyContent } from '@/utils/utils';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const mediaLoader = useAxiosRequest(async (id?: string) => {
  return await api.Media.getById(id ?? String(route.params.id))();
});
const media = computed(() => mediaLoader.data.value);
onBeforeRouteUpdate(async (to, from) => {
  if (to.name === 'media' && to.params.id !== from.params.id) {
    await mediaLoader.request(String(to.params.id));
  }
});

const recommendsLoader = useAxiosPageLoader(
  async () => {
    return await api.Media.query({
      sort: 'createAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 12 },
);
const recommends = computed(() => recommendsLoader.items.value);

const actions = [
  {
    text: t('media.actions.copy'),
    icon: mdiContentCopy,
    color: 'info',
    click: () => {
      if (media.value) {
        copyContent(api.File.buildRawPath(media.value.file!.id, media.value.file!.name))
          .then(() => {
            toast.toastSuccess(t('utils.copied'));
          })
          .catch(() => {
            toast.toastError(t('utils.copyFailed'));
          });
      }
    },
  },
  {
    text: t('media.actions.openInVLC'),
    icon: mdiVlc,
    color: 'warning',
    click: () => {
      if (media.value) {
        const a = document.createElement('a');
        a.href = `vlc://${api.File.buildRawPath(media.value.file!.id, media.value.file!.name)}`;
        a.click();
      }
    },
  },
  {
    text: t('media.actions.play'),
    icon: mdiMotionPlayOutline,
    color: 'secondary',
    click: () => {
      //
    },
  },
];
</script>

<style scoped lang="sass"></style>
