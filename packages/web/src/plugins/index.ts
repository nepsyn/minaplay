import vuetify from './vuetify';
import pinia from '../store';
import router from '../router';
import i18n from '../lang';
import type { App } from 'vue';

export function registerPlugins(app: App) {
  app.use(vuetify).use(router).use(pinia).use(i18n);
}
