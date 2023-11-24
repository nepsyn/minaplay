<template>
  <v-container class="pa-0">
    <span class="text-h4">{{ t('rule.sections.info') }}</span>
    <single-item-loader class="px-0 py-2 mt-4" :loader="ruleLoader">
      <div class="d-flex flex-column">
        <v-text-field
          :label="t('rule.entity.id')"
          variant="outlined"
          hide-details
          color="primary"
          density="compact"
          v-model.trim="edit!.id"
          readonly
          :append-inner-icon="mdiPencilLock"
        ></v-text-field>
        <v-text-field
          :label="t('rule.entity.remark')"
          class="mt-4"
          variant="outlined"
          color="primary"
          density="compact"
          v-model.trim="edit!.remark"
          maxlength="40"
          counter="40"
          persistent-counter
        ></v-text-field>
        <div class="d-flex flex-row mt-4">
          <v-btn
            @click="save"
            :loading="saving"
            variant="tonal"
            color="primary"
            class="flex-grow-1"
            :prepend-icon="mdiCheck"
          >
            {{ t('app.actions.save') }}
          </v-btn>
          <v-btn @click="reset" color="warning" variant="tonal" class="flex-grow-0 ml-2" :prepend-icon="mdiClose">
            {{ t('app.actions.reset') }}
          </v-btn>
        </div>
        <span class="text-h4 mt-12">{{ t('rule.info.actions') }}</span>
        <v-sheet class="my-4" border rounded>
          <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
            <v-container class="pa-0">
              <p class="text-subtitle-1">{{ t('rule.info.delete') }}</p>
              <p class="text-caption">{{ t('rule.info.deleteDescription') }}</p>
            </v-container>
            <v-btn class="ml-4" variant="tonal" color="error" :loading="ruleDeleting">
              {{ t('app.actions.delete') }}
              <v-dialog width="auto" activator="parent" close-on-content-click>
                <v-card>
                  <v-card-title>{{ t('app.actions.deleteTitle') }}</v-card-title>
                  <v-card-text>{{ t('app.actions.deleteConfirm', { item: t('app.entities.rule') }) }}</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="text">
                      {{ t('app.cancel') }}
                    </v-btn>
                    <v-btn color="error" variant="plain" @click="deleteRule">
                      {{ t('app.ok') }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-btn>
          </v-container>
        </v-sheet>
      </div>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { computed, ref } from 'vue';
import { useApiStore } from '@/store/api';
import { useRoute, useRouter } from 'vue-router';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { mdiCheck, mdiClose, mdiPencilLock } from '@mdi/js';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useToastStore } from '@/store/toast';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const ruleLoader = useAxiosRequest(api.Rule.getById(Number(route.params.id)));
ruleLoader.onResolved((data) => {
  edit.value = { ...data };
});
const source = computed(() => ruleLoader.data.value);
const edit = ref(source.value);

const {
  pending: saving,
  request: save,
  onResolved: onSaved,
  onRejected: onSaveFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.update(Number(route.params.id))({
    remark: edit.value?.remark,
  });
});
onSaved((data) => {
  toast.toastSuccess(t('app.actions.saveToast'));
  ruleLoader.data.value = data;
});
onSaveFailed(() => {
  toast.toastError(t(`error.${ErrorCodeEnum.BAD_REQUEST}`));
});

const {
  pending: ruleDeleting,
  request: deleteRule,
  onResolved: onRuleDeleted,
  onRejected: onRuleDeleteFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.delete(Number(route.params.id))();
});
onRuleDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  await router.replace({ path: '/rule' });
});
onRuleDeleteFailed(() => {
  toast.toastError(t('error.other'));
});

const reset = () => {
  edit.value = { ...ruleLoader.data.value! };
};
</script>

<style scoped lang="sass"></style>
