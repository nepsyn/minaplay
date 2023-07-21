import { createApp } from 'vue';
import App from './App.vue';
import Router from './plugins/router';
import Vuetify from './plugins/vuetify';
import Pinia from './plugins/pinia';
import { Api } from '@/api/api';
import '@/scss/main.scss';

Api.setToken(localStorage.getItem('minaplay-token'));

export const app = createApp(App);
export const router = Router();
export const vuetify = Vuetify();
export const pinia = Pinia();

app.use(router).use(vuetify).use(pinia);
app.mount('#app');
