import { registerPlugins } from '@/plugins';
import { createApp } from 'vue';
import App from './App.vue';
import '@/plugins/monaco';
import '@/css/main.sass';
import '@/css/highlightjs.sass';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App);
registerPlugins(app);
registerSW({ immediate: true });
app.mount('#app');
