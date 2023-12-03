import { createRouter, createWebHashHistory, NavigationGuard, RouteRecordRaw } from 'vue-router';
import { useApiStore } from '@/store/api';

const LoginGuard: NavigationGuard = (to) => {
  const api = useApiStore();

  return (
    api.isLogin || {
      path: '/login',
      query: {
        redirectUrl: to.fullPath,
      },
    }
  );
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/home/Layout.vue'),
    redirect: '/resource',
    children: [
      {
        path: '/resource',
        name: 'resource',
        children: [
          {
            path: '/resource',
            name: 'resource',
            component: () => import('@/views/Resource.vue'),
          },
          {
            path: '/media/:mediaId',
            name: 'media',
            component: () => import('@/views/resource/MediaPlay.vue'),
          },
          {
            path: '/episode/:episodeId',
            name: 'episode',
            component: () => import('@/views/resource/MediaPlay.vue'),
          },
          {
            path: '/series/:seriesId',
            name: 'series',
            component: () => import('@/views/resource/SeriesInfo.vue'),
          },
        ],
      },
      {
        path: '/live',
        name: 'live',
        component: () => import('@/views/Live.vue'),
      },
      {
        path: '/source',
        name: 'source',
        children: [
          {
            path: '/source',
            component: () => import('@/views/Source.vue'),
          },
          {
            path: '/source/:id',
            component: () => import('@/views/source/SourceDetail.vue'),
            redirect: (to) => `/source/${to.params.id}/info`,
            children: [
              {
                path: '/source/:id/info',
                name: 'source-info',
                component: () => import('@/views/source/SourceInfo.vue'),
              },
              {
                path: '/source/:id/raw',
                name: 'source-raw',
                component: () => import('@/views/source/SourceRawData.vue'),
              },
              {
                path: '/source/:id/log',
                name: 'source-log',
                component: () => import('@/views/source/SourceParseLog.vue'),
              },
              {
                path: '/source/:id/download',
                name: 'source-download',
                component: () => import('@/views/common/SubscribeDownload.vue'),
              },
            ],
          },
        ],
      },
      {
        path: '/rule',
        name: 'rule',
        children: [
          {
            path: '/rule',
            component: () => import('@/views/Rule.vue'),
          },
          {
            path: '/rule/:id',
            component: () => import('@/views/rule/RuleDetail.vue'),
            redirect: (to) => `/rule/${to.params.id}/info`,
            children: [
              {
                path: '/rule/:id/info',
                name: 'rule-info',
                component: () => import('@/views/rule/RuleInfo.vue'),
              },
              {
                path: '/rule/:id/error',
                name: 'rule-error',
                component: () => import('@/views/rule/RuleErrorLog.vue'),
              },
              {
                path: '/rule/:id/download',
                name: 'rule-download',
                component: () => import('@/views/common/SubscribeDownload.vue'),
              },
            ],
          },
        ],
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('@/views/Setting.vue'),
      },
    ],
    beforeEnter: LoginGuard,
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('@/layouts/login/View.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
