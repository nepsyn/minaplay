<script setup lang="ts">
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { mdiDotsVertical } from '@mdi/js';
import { computed } from 'vue';

interface MenuItem<T = any> {
  text: string;
  icon?: string;
  color?: string;
  menu?: {
    title: string;
    text: string;
  };
  show?: (item: T) => boolean | undefined;
  click?: (item: T) => any;
}

const props = withDefaults(
  defineProps<{
    actions: MenuItem[];
    item?: any;
    boxed?: boolean;
  }>(),
  {
    boxed: false,
  },
);

const actions = computed(() => {
  return (props.actions ?? []).filter((action) => action.show?.(props.item));
});
</script>

<template>
  <div class="d-flex align-center">
    <template v-if="boxed">
      <v-menu location="bottom" close-on-content-click>
        <template #activator="{ props }">
          <v-btn
            v-if="actions.length > 0"
            :icon="mdiDotsVertical"
            size="small"
            variant="text"
            class="d-flex"
            v-bind="props"
          ></v-btn>
        </template>
        <v-card>
          <v-list class="pa-0" density="compact">
            <template v-for="(action, index) in actions" :key="index">
              <v-dialog v-if="action.menu" close-on-content-click>
                <template #activator="{ props }">
                  <v-list-item v-bind="props" :prepend-icon="action.icon!" :base-color="action.color!">
                    {{ action.text }}
                  </v-list-item>
                </template>
                <v-card>
                  <v-card-title>{{ action.menu.title }}</v-card-title>
                  <v-card-text>{{ action.menu.text }}</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="text">取消</v-btn>
                    <v-btn color="error" variant="plain" @click="action.click?.(item)">确定</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-list-item
                v-else
                :prepend-icon="action.icon!"
                :base-color="action.color!"
                @click="action.click?.(item)"
              >
                {{ action.text }}
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-menu>
    </template>
    <template v-else>
      <template v-for="(action, index) in actions" :key="index">
        <v-menu v-if="action.menu">
          <template #activator="{ props }">
            <action-btn
              v-bind="props"
              :text="action.text"
              :icon="action.icon"
              size="small"
              :color="action.color"
              variant="tonal"
              class="mx-1"
              :class="{ 'ms-1': index > 0 }"
            ></action-btn>
          </template>
          <v-card>
            <v-card-title>{{ action.menu.title }}</v-card-title>
            <v-card-text>{{ action.menu.text }}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text">取消</v-btn>
              <v-btn color="error" variant="plain" @click="action.click?.(item)">确定</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <action-btn
          v-else
          :text="action.text"
          :icon="action.icon"
          size="small"
          :color="action.color"
          variant="tonal"
          @click.stop="action.click?.(item)"
          :class="{ 'ms-1': index > 0 }"
        ></action-btn>
      </template>
    </template>
  </div>
</template>

<style scoped lang="sass"></style>
