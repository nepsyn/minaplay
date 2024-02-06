<template>
  <v-card flat border class="d-flex flex-column">
    <v-card-title class="d-flex flex-row align-center">
      <span class="text-wrap text-break cursor-pointer" @click="router.push({ path: `/rule/${rule.id}` })">
        {{ rule.remark || t('rule.unnamed') }}
      </span>
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
    <v-card-text class="d-flex flex-row align-center py-2">
      <div>
        <v-tooltip v-for="source in rule.sources ?? []" location="bottom" :key="source.id">
          {{ source.title || source.remark || t('source.unnamed') }}
          <br />
          {{ source.url }}
          <template #activator="{ props }">
            <v-icon class="mr-1" v-bind="props">
              <v-img cover :src="getFaviconUrl(source.url)" aspect-ratio="1">
                <template #placeholder>
                  <v-img :src="BlankFavicon" aspect-ratio="1"></v-img>
                </template>
              </v-img>
            </v-icon>
          </template>
        </v-tooltip>
      </div>
      <v-spacer></v-spacer>
      <v-btn variant="outlined" density="comfortable" @click="router.push({ path: `/rule/${rule.id}` })">
        {{ t('app.actions.edit') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { RuleEntity } from '@/api/interfaces/subscribe.interface';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin';
import BlankFavicon from '@/assets/blank-favicon.png';

const hightlightjs = hljsVuePlugin.component;
const { t } = useI18n();
const router = useRouter();

defineProps<{
  rule: RuleEntity;
}>();

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return '://favicon.ico';
  }
};
</script>

<style scoped lang="sass"></style>
