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
import SeriesView from '@/views/home/resource/SeriesView.vue';
import MediasView from '@/views/home/resource/MediasView.vue';
import MediaPlay from '@/views/home/resource/media/MediaPlay.vue';
import AdminOverview from '@/views/home/admin/AdminOverview.vue';
import AdminUser from '@/views/home/admin/AdminUser.vue';
import AdminSubscribe from '@/views/home/admin/AdminSubscribe.vue';
import AdminMedia from '@/views/home/admin/AdminMedia.vue';
import AdminSeries from '@/views/home/admin/AdminSeries.vue';
import AdminDownload from '@/views/home/admin/AdminDownload.vue';
import { PermissionEnum } from '@/api/enums/permission.enum';
import AdminFile from '@/views/home/admin/AdminFile.vue';

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
        children: [
          {
            path: '/resource',
            component: Resource,
            redirect: '/series',
            children: [
              {
                path: '/series',
                component: SeriesView,
                meta: {
                  permission: [PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW],
                },
              },
              {
                path: '/media',
                component: MediasView,
                meta: {
                  permission: [PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW],
                },
              },
            ],
          },
          {
            path: '/media/:id',
            component: MediaPlay,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW],
            },
          },
        ],
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
            redirect: (to) => `/subscribe/${to.params.id}/detail`,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP],
            },
            children: [
              {
                path: '/subscribe/:id/detail',
                component: SourceInfo,
              },
              {
                path: '/subscribe/:id/rules',
                component: SourceRules,
              },
              {
                path: '/subscribe/:id/raw',
                component: SourceRawData,
              },
              {
                path: '/subscribe/:id/logs',
                component: SourceFetchLogs,
              },
              {
                path: '/subscribe/:id/downloads',
                component: SourceDownloadItems,
              },
            ],
          },
        ],
      },
      {
        path: '/admin',
        component: Admin,
        redirect: '/admin/overview',
        children: [
          {
            path: '/admin/overview',
            component: AdminOverview,
            meta: {
              permission: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/admin/user',
            component: AdminUser,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.USER_OP],
            },
          },
          {
            path: '/admin/subscribe',
            component: AdminSubscribe,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP],
            },
          },
          {
            path: '/admin/media',
            component: AdminMedia,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP],
            },
          },
          {
            path: '/admin/series',
            component: AdminSeries,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP],
            },
          },
          {
            path: '/admin/file',
            component: AdminFile,
            meta: {
              permission: [PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP],
            },
          },
          {
            path: '/admin/download',
            component: AdminDownload,
            meta: {
              permission: [PermissionEnum.ROOT_OP],
            },
          },
        ],
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
