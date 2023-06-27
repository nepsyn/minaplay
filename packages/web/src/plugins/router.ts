import { createRouter, createWebHashHistory, NavigationGuard, RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';
import Media from '@/views/home/Media.vue';
import Live from '@/views/home/Live.vue';
import Subscribe from '@/views/home/Subscribe.vue';
import Admin from '@/views/home/Admin.vue';
import Setting from '@/views/home/Setting.vue';
import { Api } from '@/api/api';
import Login from '@/views/Login.vue';
import SubscribeDetail from '@/views/home/subscribe/SubscribeDetail.vue';

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
        children: [
          {
            path: '/subscribe/:id',
            component: SubscribeDetail,
          },
        ],
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
    beforeEnter: LoginGuard,
  },
  {
    path: '/login',
    component: Login,
  },
];

export default () =>
  createRouter({
    history: createWebHashHistory(),
    routes,
  });
