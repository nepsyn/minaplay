<script setup lang="ts">
import MediaPlate from '@/components/resource/MediaPlate.vue';
import { mdiHistory, mdiRefresh } from '@mdi/js';
import { ref, Ref } from 'vue';
import { MediaQueryDto } from '@/interfaces/media.interface';
import { useRouter } from 'vue-router';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const router = useRouter();

const latestUpdateQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 8,
  sort: 'createAt',
  order: 'DESC',
});
</script>

<template>
  <v-container>
    <media-plate
      title="最近更新"
      :query="latestUpdateQuery"
      :icon="mdiHistory"
      cols="12"
      sm="6"
      md="4"
      lg="3"
      icon-color="primary"
      @click:media="(media) => router.push(`/media/${media.id}`)"
    >
      <template #actions="{ load, reset, status }">
        <action-btn
          color="primary"
          text="刷新"
          :icon="mdiRefresh"
          @click="reset() & load?.()"
          :loading="status === 'loading'"
        ></action-btn>
      </template>
    </media-plate>
  </v-container>
</template>

<style scoped lang="sass"></style>
