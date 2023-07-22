<script setup lang="ts">
import MediaPlate from '@/components/resource/MediaPlate.vue';
import { mdiHistory, mdiRefresh } from '@mdi/js';
import { ref, Ref } from 'vue';
import { MediaQueryDto } from '@/interfaces/media.interface';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

const router = useRouter();
const display = useDisplay();

const latestUpdateQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 8,
  sort: 'createAt',
  order: 'DESC',
});
</script>

<template>
  <v-container fluid class="px-8 pb-6">
    <media-plate
      title="最近更新"
      :query="latestUpdateQuery"
      :icon="mdiHistory"
      :cols="display.smAndUp.value ? 4 : 1"
      icon-color="primary"
      @media-click="(media) => router.push(`/media/${media.id}`)"
    >
      <template #actions="{ load, reset, status }">
        <v-btn
          variant="outlined"
          color="primary"
          :prepend-icon="mdiRefresh"
          @click="reset() & load?.()"
          :loading="status === 'loading'"
        >
          刷新
        </v-btn>
      </template>
    </media-plate>
  </v-container>
</template>

<style scoped lang="sass"></style>
