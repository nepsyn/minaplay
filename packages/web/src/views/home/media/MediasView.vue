<script setup lang="ts">
import MediaPlate from '@/components/resource/MediaPlate.vue';
import { mdiHistory, mdiRefresh } from '@mdi/js';
import { ref, Ref } from 'vue';
import { MediaQueryDto } from '@/interfaces/media.interface';

const latestUpdateQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 8,
  sort: 'createAt',
  order: 'DESC',
});
</script>

<template>
  <v-container fluid class="px-8">
    <media-plate title="最近更新" :query="latestUpdateQuery" :icon="mdiHistory" icon-color="primary">
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
