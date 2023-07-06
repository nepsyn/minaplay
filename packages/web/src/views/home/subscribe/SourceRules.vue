<script setup lang="ts">
import { mdiCheck, mdiClose, mdiPlus, mdiRefresh } from '@mdi/js';
import { Api } from '@/api/api';
import { computed, ref, Ref, watch } from 'vue';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'vuetify';
import _ from 'lodash';
import { useRoute } from 'vue-router';
import { useApp } from '@/store/app';
import { useSubscribeStore } from '@/store/subscribe';
import { ApiQueryDto } from '@/interfaces/common.interface';
import { RuleEntity } from '@/interfaces/subscribe.interface';
import ItemsProvider from '@/components/ItemsProvider.vue';
import LabelEditor from '@/components/LabelEditor.vue';
import { Codemirror } from 'vue-codemirror';

const app = useApp();
const route = useRoute();
const theme = useTheme();
const subscribe = useSubscribeStore();

const sourceId = computed(() => Number(route.params.id));

const rules: Ref<RuleEntity[]> = ref([]);
const rulesQuery: ApiQueryDto<RuleEntity> = {
  page: 0,
  size: 1024,
  sort: 'createAt',
  order: 'DESC',
};
const loadRules = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.getRulesById(sourceId.value)(rulesQuery);
    rules.value.push(...response.data.items);
    rulesQuery.page!++;
    done(rules.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('加载规则列表失败');
    done('error');
  }
};
const resetRules = () => {
  rules.value = [];
  rulesQuery.page = 0;
};

const ruleCodeEditorExtensions = computed(() =>
  theme.global.name.value === 'dark' ? [javascript(), oneDark] : [javascript()],
);

const editRuleId: Ref<number | undefined> = ref(undefined);
const onKeydown = async (e: KeyboardEvent, id: number, code?: string) => {
  if (e.code === 'KeyS') {
    e.preventDefault();
    await saveRuleCode(id, code);
  }
};
const saveRuleCode = _.throttle(
  async (id: number, code?: string) => {
    editRuleId.value = id;
    try {
      const response = await Api.SubscribeRule.update(id)({ code });
      const index = rules.value.findIndex((v) => v.id === id);
      if (index > -1) {
        rules.value[index] = response.data;
      }
      app.toastSuccess('代码保存成功');
    } catch {
      app.toastError('代码保存失败！');
    } finally {
      editRuleId.value = undefined;
    }
  },
  3000,
  { trailing: false },
);

const deleteRuleId: Ref<number | undefined> = ref(undefined);
const deleteRule = async (id: number) => {
  deleteRuleId.value = id;
  try {
    await Api.SubscribeRule.delete(id)();
    rules.value = rules.value.filter((v) => v.id !== id);
    app.toastSuccess('删除规则成功');
  } catch {
    app.toastError('删除规则失败');
  } finally {
    deleteRuleId.value = undefined;
  }
};

const newRuleCodeSample = `
/**
 * Validator used to determine if the resource item is to be downloaded
 * @param {Object} entry - The entire feed entry
 * @param {String} entry.id - Entry guid
 * @param {String} entry.link - Entry link
 * @param {String} entry.title - Entry title
 * @param {String} entry.description - Entry description
 * @param {Date} entry.published - Entry publish time
 * @param {Object} entry.enclosure - Entry enclosure resource item
 * @param {String} entry.enclosure.url - Entry enclosure url
 * @param {String?} entry.enclosure.type - Entry enclosure type
 * @returns {Boolean} Boolean value used to determine if the resource item is to be downloaded
 */
module.exports = function(entry) {
  return false;
}
`.trim();
const ruleCreating = ref(false);
const createRule = async () => {
  ruleCreating.value = true;
  try {
    const response = await Api.SubscribeRule.create({
      remark: `新订阅规则(${new Date().toLocaleString()})`,
      sourceId: sourceId.value,
      code: newRuleCodeSample,
    });
    rules.value.unshift(response.data);
    app.toastSuccess('创建规则成功');
  } catch {
    app.toastError('创建规则失败');
  } finally {
    ruleCreating.value = false;
  }
};

const providerRef: Ref<any> = ref(null);
watch(
  () => route.params,
  async (old, now) => {
    if (old.id !== now?.id && !isNaN(Number(route.params.id))) {
      resetRules();
      saveRuleCode.cancel();

      if (providerRef.value) {
        providerRef.value.load();
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
        <span class="text-h6">订阅源规则 ({{ rules.length }})</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          :loading="providerRef?.status === 'loading'"
          :prepend-icon="mdiRefresh"
          @click="resetRules() & providerRef.load()"
          >重新加载
        </v-btn>
        <v-btn
          class="ml-2"
          variant="outlined"
          color="warning"
          :prepend-icon="mdiPlus"
          :loading="ruleCreating"
          @click="createRule"
          >添加
        </v-btn>
      </v-container>
      <v-divider class="my-4"></v-divider>
      <items-provider ref="providerRef" :load-fn="loadRules" :items="rules" class="pa-0">
        <v-sheet class="my-4" border rounded v-for="(rule, index) in rules">
          <v-toolbar density="compact" color="background" class="px-4 py-2 d-flex flex-row align-center">
            <label-editor
              :save-fn="(remark) => Api.SubscribeRule.update(rule.id)({ remark })"
              @saved="(resp) => (rules[index] = resp.data)"
              @error="app.toastError('备注保存失败！')"
              v-model="rule.remark"
              maxlength="40"
            >
              <span class="text-subtitle-1 font-weight-bold">{{ rule.remark || '未命名规则' }}</span>
            </label-editor>
            <v-spacer></v-spacer>
            <span class="text-subtitle-2 font-weight-light">
              更新于 {{ new Date(rule.updateAt).toLocaleString() }}
            </span>
          </v-toolbar>
          <v-divider></v-divider>
          <codemirror
            indent-with-tab
            v-model="rule.code"
            @keydown.ctrl="(e) => onKeydown(e, rule.id, rule.code)"
            :extensions="ruleCodeEditorExtensions"
            style="cursor: text"
          ></codemirror>
          <v-divider></v-divider>
          <v-container fluid class="px-4 py-2 d-flex flex-row justify-end">
            <v-menu location="left">
              <template #activator="{ props }">
                <v-btn
                  variant="tonal"
                  color="error"
                  v-bind="props"
                  :prepend-icon="mdiClose"
                  :loading="deleteRuleId === rule.id"
                  :disabled="deleteRuleId !== undefined && deleteRuleId !== rule.id"
                  >删除规则
                </v-btn>
              </template>
              <v-card>
                <v-card-title>删除确认</v-card-title>
                <v-card-text>确定要删除该条规则吗？该操作不可撤销！</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" variant="text">取消</v-btn>
                  <v-btn color="error" variant="plain" @click="deleteRule(rule.id)">确认</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
            <v-btn
              class="ml-4"
              variant="tonal"
              color="info"
              :prepend-icon="mdiCheck"
              @click="saveRuleCode(rule.id, rule.code)"
              :loading="editRuleId === rule.id"
              :disabled="editRuleId !== undefined && editRuleId !== rule.id"
              >保存代码
            </v-btn>
          </v-container>
        </v-sheet>
      </items-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
