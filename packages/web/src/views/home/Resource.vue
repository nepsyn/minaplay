<script lang="ts" setup>
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <to-top-container class="scrollable-container">
      <router-view v-slot="{ Component }">
        <v-scroll-x-reverse-transition leave-absolute>
          <keep-alive>
            <component :is="Component"></component>
          </keep-alive>
        </v-scroll-x-reverse-transition>
      </router-view>
    </to-top-container>
  </v-container>
</template>

<style lang="sass" scoped></style>
