<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <span class="text-h4">{{ t('rule.title') }}</span>
      <v-row class="py-2 mt-4" dense>
        <v-col cols="12" sm="auto" class="flex-grow-1">
          <v-text-field
            variant="outlined"
            density="compact"
            color="primary"
            hide-details
            :label="t('app.input.keyword')"
            :placeholder="t('app.input.placeholder', { item: t('app.entities.rule') })"
            clearable
            v-model="filters.keyword"
            @update:model-value="useQuery"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="auto" class="flex-grow-0">
          <v-btn height="40" color="success" variant="flat" :prepend-icon="mdiPlus" block>
            {{ t('app.actions.add') }}
          </v-btn>
        </v-col>
      </v-row>
      <v-divider class="my-2"></v-divider>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { mdiPlus } from '@mdi/js';
import { ref } from 'vue';
import { debounce } from '@/utils/utils';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { RuleQueryDto } from '@/api/interfaces/subscribe.interface';
import { useApiStore } from '@/store/api';

const { t } = useI18n();
const api = useApiStore();

const rulesLoader = useAxiosPageLoader(
  async (query?: RuleQueryDto) => {
    return await api.Rule.query({
      ...(query ?? {}),
      keyword: filters.value.keyword,
    });
  },
  { page: 0, size: 120 },
);

const filters = ref<Partial<RuleQueryDto>>({
  keyword: '',
});
const query = () => {
  rulesLoader.reset();
  rulesLoader.request();
};
const useQuery = debounce(query, 1000);
</script>

<style scoped lang="sass"></style>
