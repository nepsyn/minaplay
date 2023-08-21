import { createRouter, createWebHashHistory, NavigationGuard, RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';
import Resource from '@/views/home/Resource.vue';
import Live from '@/views/home/Live.vue';
import Subscribe from '@/views/home/Subscribe.vue';
import Admin from '@/views/home/Admin.vue';
import Setting from '@/views/home/Setting.vue';
import { Api } from '@/api/api';
import Login from '@/views/Login.vue';
import SourceInfo from '@/views/home/subscribe/SourceDetail.vue';
import SourceRules from '@/views/home/subscribe/SourceRules.vue';
import SourceRawData from '@/views/home/subscribe/SourceRawData.vue';
import SourceFetchLogs from '@/views/home/subscribe/SourceFetchLogs.vue';
import SourceDownloadItems from '@/views/home/subscribe/SourceDownloadItems.vue';
import ResourceView from '@/views/home/resource/ResourceView.vue';
import AdminOverview from '@/views/home/admin/AdminOverview.vue';
import AdminUser from '@/views/home/admin/AdminUser.vue';
import AdminSubscribe from '@/views/home/admin/AdminSubscribe.vue';
import AdminMedia from '@/views/home/admin/AdminMedia.vue';
import AdminSeries from '@/views/home/admin/AdminSeries.vue';
import AdminDownload from '@/views/home/admin/AdminDownload.vue';
import AdminFile from '@/views/home/admin/AdminFile.vue';
import MediaPlay from '@/views/home/resource/MediaPlay.vue';
import SeriesDetail from '@/views/home/resource/SeriesDetail.vue';
import EpisodePlay from '@/views/home/resource/EpisodePlay.vue';

const LoginGuard: NavigationGuard = (to, from, next) => {
  if (Api.isLogin) {
    next();
  } else {
    next({
      path: '/login',
      query: {
        redirect_url: to.fullPath,
      },
    });
  }
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    redirect: '/resource',
    children: [
      {
        path: '/resource',
        component: Resource,
        children: [
          {
            name: 'resource',
            path: '/resource',
            component: ResourceView,
          },
          {
            name: 'series',
            path: '/series/:id',
            component: SeriesDetail,
          },
          {
            name: 'media',
            path: '/media/:id',
            component: MediaPlay,
          },
          {
            name: 'episode',
            path: '/ep/:id',
            component: EpisodePlay,
          },
        ],
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
            name: 'source',
            path: '/subscribe/:id',
            redirect: (to) => `/subscribe/${to.params.id}/detail`,
            children: [
              {
                name: 'source-detail',
                path: '/subscribe/:id/detail',
                component: SourceInfo,
              },
              {
                name: 'source-rules',
                path: '/subscribe/:id/rules',
                component: SourceRules,
              },
              {
                name: 'source-raw',
                path: '/subscribe/:id/raw',
                component: SourceRawData,
              },
              {
                name: 'source-logs',
                path: '/subscribe/:id/logs',
                component: SourceFetchLogs,
              },
              {
                name: 'source-downloads',
                path: '/subscribe/:id/downloads',
                component: SourceDownloadItems,
              },
            ],
          },
        ],
      },
      {
        name: 'admin',
        path: '/admin',
        component: Admin,
        children: [
          {
            name: 'admin-overview',
            path: '/admin/overview',
            component: AdminOverview,
          },
          {
            name: 'admin-user',
            path: '/admin/user',
            component: AdminUser,
          },
          {
            name: 'admin-subscribe',
            path: '/admin/subscribe',
            component: AdminSubscribe,
          },
          {
            name: 'admin-media',
            path: '/admin/media',
            component: AdminMedia,
          },
          {
            name: 'admin-series',
            path: '/admin/series',
            component: AdminSeries,
          },
          {
            name: 'admin-file',
            path: '/admin/file',
            component: AdminFile,
          },
          {
            name: 'admin-download',
            path: '/admin/download',
            component: AdminDownload,
          },
        ],
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
