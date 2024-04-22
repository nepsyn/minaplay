<template>
  <single-item-loader class="pa-0" :loader="seriesLoader"></single-item-loader>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject } from 'vue';
import { MinaPlayParserMetadata, PluginControl } from '@/api/interfaces/plugin.interface';
import { useRoute } from 'vue-router';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';

const api = useApiStore();
const route = useRoute();

const parsers = inject<ComputedRef<(MinaPlayParserMetadata & { plugin: PluginControl })[]>>('parsers');
const parser = computed(() => {
  return (parsers?.value ?? []).find(
    ({ name, plugin }) => name === route.params.parserId && plugin.id === route.params.pluginId,
  );
});

const seriesLoader = useAxiosRequest(async () => {
  return api.Plugin.getParserSeries(parser.value!.plugin.id, parser.value!.name, route.params.seriesId as string)();
});
const { data: series } = seriesLoader;
</script>

<style scoped lang="sass"></style>
