<script setup lang="ts">
import { mdiCheck, mdiClose } from '@mdi/js';
import { Api } from '@/api/api';
import { useDisplay } from 'vuetify';
import { useApp } from '@/store/app';
import { computed, ref } from 'vue';
import { UserEntity } from '@/interfaces/user.interface';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { PermissionEnum } from '@/api/enums/permission.enum';

const app = useApp();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    item: UserEntity;
  }>(),
  {
    modelValue: false,
  },
);

const dialog = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const groups = [
  {
    name: '用户',
    items: [
      { name: '管理', value: PermissionEnum.USER_OP },
      { name: '查看', value: PermissionEnum.USER_VIEW },
    ],
  },
  {
    name: '文件',
    items: [
      { name: '管理', value: PermissionEnum.FILE_OP },
      { name: '视频上传', value: PermissionEnum.FILE_UPLOAD_VIDEO },
      { name: '图片上传', value: PermissionEnum.FILE_UPLOAD_IMAGE },
    ],
  },
  {
    name: '媒体',
    items: [
      { name: '管理', value: PermissionEnum.MEDIA_OP },
      { name: '查看', value: PermissionEnum.MEDIA_VIEW },
    ],
  },
  {
    name: '剧集',
    items: [
      { name: '管理', value: PermissionEnum.SERIES_OP },
      { name: '查看', value: PermissionEnum.SERIES_VIEW },
    ],
  },
  {
    name: '订阅',
    items: [
      { name: '管理', value: PermissionEnum.SUBSCRIBE_OP },
      { name: '查看', value: PermissionEnum.SUBSCRIBE_VIEW },
    ],
  },
  {
    name: '放映室',
    items: [
      { name: '管理', value: PermissionEnum.LIVE_OP },
      { name: '查看', value: PermissionEnum.LIVE_VIEW },
    ],
  },
];

const emits = defineEmits<{
  (e: 'saved', item: UserEntity): any;
  (e: 'error', error: any): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const editLoading = ref(false);
const saveEdit = async () => {
  editLoading.value = true;
  try {
    const response = await Api.Auth.grant(props.item.id)({
      permissionNames: props.item.permissionNames,
    });
    emits('saved', response.data);
    dialog.value = false;
  } catch (error: any) {
    emits('error', error);
  } finally {
    editLoading.value = false;
  }
};
</script>

<template>
  <v-dialog
    :class="display.smAndUp.value ? 'w-75' : 'w-100'"
    :fullscreen="!display.smAndUp.value"
    v-model="dialog"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary">
        <v-btn :icon="mdiClose" @click="dialog = false"></v-btn>
        <v-toolbar-title>编辑用户权限</v-toolbar-title>
        <action-btn :icon="mdiCheck" text="保存" variant="text" :loading="editLoading" @click="saveEdit"></action-btn>
      </v-toolbar>
      <v-card-text class="pa-0">
        <template v-for="(group, groupIndex) in groups" :key="groupIndex">
          <v-list v-model:selected="item.permissionNames" select-strategy="leaf">
            <v-list-subheader>{{ group.name }}</v-list-subheader>
            <v-list-item
              v-for="(item, itemIndex) in group.items"
              :key="`${groupIndex}-${itemIndex}`"
              :value="item.value"
            >
              <template v-slot:prepend="{ isActive }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                </v-list-item-action>
              </template>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-divider v-if="groupIndex !== groups.length - 1"></v-divider>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="sass"></style>
