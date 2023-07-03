import { createRouter, createWebHashHistory, NavigationGuard, RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';
import Media from '@/views/home/Media.vue';
import Live from '@/views/home/Live.vue';
import Subscribe from '@/views/home/Subscribe.vue';
import Admin from '@/views/home/Admin.vue';
import Setting from '@/views/home/Setting.vue';
import { Api } from '@/api/api';
import Login from '@/views/Login.vue';
import SourceDetail from '@/views/home/subscribe/SourceDetail.vue';

const LoginGuard: NavigationGuard = (to, from, next) => {
  if (!Api.isLogin) {
    next({
      path: '/login',
      query: {
        redirect_url: to.fullPath,
      },
    });
  } else {
    next();
  }
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    redirect: '/media',
    children: [
      {
        name: 'media',
        path: '/media',
        component: Media,
      },
      {
        name: 'live',
        path: '/live',
        component: Live,
      },
      {
        name: 'subscribe',
        path: '/subscribe',
        component: Subscribe,
        children: [
          {
            name: 'subscribe-detail',
            path: '/subscribe/:id',
            component: SourceDetail,
          },
        ],
      },
      {
        name: 'admin',
        path: '/admin',
        component: Admin,
      },
      {
        name: 'setting',
        path: '/setting',
        component: Setting,
      },
    ],
    beforeEnter: LoginGuard,
  },
  {
    name: 'login',
    path: '/login',
    component: Login,
  },
];

export default () =>
  createRouter({
    history: createWebHashHistory(),
    routes,
  });
