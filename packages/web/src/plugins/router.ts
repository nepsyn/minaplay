import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue';
import Media from '../views/Media.vue';
import Live from '../views/Live.vue';
import Subscribe from '../views/Subscribe.vue';
import Admin from '../views/Admin.vue';
import Setting from '../views/Setting.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
    redirect: '/media',
    children: [
      {
        path: '/media',
        component: Media,
      },
      {
        path: '/live',
        component: Live,
      },
      {
        path: '/subscribe',
        component: Subscribe,
      },
      {
        path: '/admin',
        component: Admin,
      },
      {
        path: '/setting',
        component: Setting,
      },
    ],
  },
];

export default () =>
  createRouter({
    history: createWebHashHistory(),
    routes,
  });
