<template>
  <v-layout-item
    class="d-flex flex-column justify-end pointer-events-none"
    :model-value="true"
    position="right"
    size="400"
    style="z-index: 10000"
  >
    <v-container fluid class="px-6 py-8">
      <v-slide-x-reverse-transition group>
        <v-alert
          class="pointer-events-initial mt-2"
          v-for="message in toast.messages"
          density="compact"
          :key="message.id"
          :type="message.type"
          :text="message.content"
          closable
          @click:close="toast.closeToast(message.id)"
        >
        </v-alert>
      </v-slide-x-reverse-transition>
    </v-container>
  </v-layout-item>
</template>

<script setup lang="ts">
import { useToastStore } from '@/store/toast';

const toast = useToastStore();
</script>

<style scoped lang="sass">
::v-deep(.v-alert__prepend)
  align-self: center

.pointer-events-none
  pointer-events: none

.pointer-events-initial
  pointer-events: initial
</style>
