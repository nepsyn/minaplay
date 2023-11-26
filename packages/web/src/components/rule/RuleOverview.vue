<template>
  <v-card flat border class="d-flex flex-column">
    <v-card-title class="d-flex flex-row align-center">
      <span class="text-wrap text-break">{{ rule.remark ?? t('rule.unnamed') }}</span>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="flex-grow-1 pa-0">
      <hightlightjs
        class="text-pre-wrap h-100"
        languaue="typescript"
        :code="rule.code"
        style="max-height: 320px"
      ></hightlightjs>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" color="primary" @click="router.push({ path: `/rule/${rule.id}` })">
        {{ t('app.actions.edit') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { RuleEntity } from '@/api/interfaces/subscribe.interface';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin';

const hightlightjs = hljsVuePlugin.component;
const { t } = useI18n();
const router = useRouter();

defineProps<{
  rule: RuleEntity;
}>();
</script>

<style scoped lang="sass"></style>
