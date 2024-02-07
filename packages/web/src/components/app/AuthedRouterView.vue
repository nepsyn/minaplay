<template>
  <router-view v-if="valid" v-slot="{ Component }">
    <slot :Component="Component">
      <component :is="Component"></component>
    </slot>
  </router-view>
  <no-permission v-else></no-permission>
</template>

<script setup lang="ts">
import { useApiStore } from '@/store/api';
import { useRoute } from 'vue-router';
import { PermissionEnum } from '@/api/enums/permission.enum';
import { computed } from 'vue';
import NoPermission from '@/views/error/NoPermission.vue';

const api = useApiStore();
const route = useRoute();

const valid = computed(() => {
  if (props.match && !new RegExp(props.match).test(route.path)) {
    return true;
  }

  const permissions: PermissionEnum[] = (route.meta?.permissions as PermissionEnum[]) ?? [];
  return api.user === undefined || permissions.length === 0 || api.hasPermission(...permissions);
});

const props = defineProps<{
  match?: string;
}>();
</script>

<style scoped lang="sass"></style>
