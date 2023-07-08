<script setup lang="ts">
import { mdiRefresh } from '@mdi/js';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { Codemirror } from 'vue-codemirror';
import { computed, ref, Ref, watch } from 'vue';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'vuetify';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRoute } from 'vue-router';

const app = useApp();
const route = useRoute();
const theme = useTheme();

const sourceId = computed(() => Number(route.params.id));

const rawDataViewerExtensions = computed(() => (theme.global.name.value === 'dark' ? [json(), oneDark] : [json()]));
const rawData = ref('');
const loadRawData = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.fetchRawData(sourceId.value)();
    rawData.value = JSON.stringify(response.data, null, 2);
    done('ok');
  } catch (error: any) {
    if (error.response?.data?.code === ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT) {
      app.toastError('订阅源格式错误，请检查订阅源URL');
    } else {
      app.toastError('获取订阅源数据失败');
    }
    done('error');
  }
};

const providerRef: Ref<any> = ref(null);
watch(
  () => route.params,
  async (old, now) => {
    if (old.id !== now?.id && !isNaN(Number(route.params.id))) {
      if (providerRef.value) {
        providerRef.value.status = 'initial';
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-container>
    <v-container fluid>
      <v-container fluid class="pa-0 d-flex flex-row align-center">
        <span class="text-h6">数据查看</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          :prepend-icon="mdiRefresh"
          :loading="providerRef?.status === 'loading'"
          @click="providerRef?.load()"
          >刷新
        </v-btn>
      </v-container>
      <v-divider class="my-4"></v-divider>
      <single-item-provider ref="providerRef" class="pa-0" :item="rawData" :load-fn="loadRawData" lazy>
        <codemirror v-model="rawData" disabled :extensions="rawDataViewerExtensions" style="cursor: text"></codemirror>
      </single-item-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
