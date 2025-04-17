import { registerPlugins } from '@/plugins';
import { createApp } from 'vue';
import App from './App.vue';
import '@/plugins/monaco';
import 'unfonts.css';
import '@/css/main.sass';
import '@/css/highlightjs.sass';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const app = createApp(App);
registerPlugins(app);
app.mount('#app');
