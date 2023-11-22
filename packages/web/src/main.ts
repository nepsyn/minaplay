import { registerPlugins } from '@/plugins';
import { createApp } from 'vue';
import App from './App.vue';
import '@/css/main.sass';

const app = createApp(App);
registerPlugins(app);
app.mount('#app');
