import { createRouter, createWebHashHistory, NavigationGuard, RouteRecordRaw } from 'vue-router';
import { useApiStore } from '@/store/api';
import { PermissionEnum } from '@/api/enums/permission.enum';

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
        children: [
          {
            path: '/resource',
            name: 'resource',
            component: () => import('@/views/Resource.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_VIEW, PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/media/:mediaId',
            name: 'media',
            component: () => import('@/views/resource/MediaPlay.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_VIEW, PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/episode/:episodeId',
            name: 'episode',
            component: () => import('@/views/resource/MediaPlay.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_VIEW, PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/series/:seriesId',
            name: 'series',
            component: () => import('@/views/resource/SeriesInfo.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_VIEW, PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
        ],
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('@/views/resource/ResourceSearch.vue'),
        meta: {
          permissions: [PermissionEnum.MEDIA_VIEW, PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
        },
      },
      {
        path: '/live',
        name: 'live',
        children: [
          {
            path: '/live',
            component: () => import('@/views/Live.vue'),
            meta: {
              permissions: [PermissionEnum.LIVE_VIEW, PermissionEnum.LIVE_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/live/:id',
            component: () => import('@/views/live/LivePlay.vue'),
            meta: {
              permissions: [PermissionEnum.LIVE_VIEW, PermissionEnum.LIVE_OP, PermissionEnum.ROOT_OP],
            },
          },
        ],
      },
      {
        path: '/source',
        name: 'source',
        children: [
          {
            path: '/source',
            component: () => import('@/views/Source.vue'),
            meta: {
              permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
            },
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
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/source/:id/raw',
                name: 'source-raw',
                component: () => import('@/views/source/SourceRawData.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/source/:id/log',
                name: 'source-log',
                component: () => import('@/views/source/SourceParseLog.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/source/:id/download',
                name: 'source-download',
                component: () => import('@/views/common/SubscribeDownload.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/source/:id/rule',
                name: 'source-rule',
                component: () => import('@/views/source/SourceRule.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
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
            meta: {
              permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
            },
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
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/rule/:id/error',
                name: 'rule-error',
                component: () => import('@/views/rule/RuleErrorLog.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/rule/:id/download',
                name: 'rule-download',
                component: () => import('@/views/common/SubscribeDownload.vue'),
                meta: {
                  permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
                },
              },
            ],
          },
        ],
      },
      {
        name: 'download',
        path: '/download',
        component: () => import('@/views/common/SubscribeDownload.vue'),
        meta: {
          permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
        },
        props: () => ({ standalone: true }),
      },
      {
        name: 'parser',
        path: '/parser',
        component: () => import('@/views/Parser.vue'),
        children: [
          {
            path: '/parser/:pluginId/:parserId',
            children: [
              {
                path: '/parser/:pluginId/:parserId',
                component: () => import('@/views/parser/ParserHome.vue'),
                meta: {
                  permissions: [PermissionEnum.ROOT_OP],
                },
              },
              {
                path: '/parser/:pluginId/:parserId/:seriesId',
                component: () => import('@/views/parser/ParserSeries.vue'),
                meta: {
                  permissions: [PermissionEnum.ROOT_OP],
                },
              },
            ],
          },
        ],
        meta: {
          permissions: [PermissionEnum.ROOT_OP],
        },
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        redirect: '/dashboard/system',
        children: [
          {
            path: '/dashboard/system',
            name: 'dash-system',
            component: () => import('@/views/dashboard/app/DashSystem.vue'),
            meta: {
              permissions: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/logs',
            name: 'dash-logs',
            component: () => import('@/views/dashboard/app/DashLogs.vue'),
            meta: {
              permissions: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/action-logs',
            name: 'dash-action-logs',
            component: () => import('@/views/dashboard/app/DashActionLogs.vue'),
            meta: {
              permissions: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/plugins',
            name: 'dash-plugins',
            component: () => import('@/views/dashboard/app/DashPlugins.vue'),
            meta: {
              permissions: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/user',
            name: 'dash-user',
            component: () => import('@/views/dashboard/modules/DashUsers.vue'),
            meta: {
              permissions: [PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/source',
            name: 'dash-source',
            component: () => import('@/views/dashboard/modules/DashSources.vue'),
            meta: {
              permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/rule',
            name: 'dash-rule',
            component: () => import('@/views/dashboard/modules/DashRules.vue'),
            meta: {
              permissions: [PermissionEnum.SUBSCRIBE_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/media',
            name: 'dash-media',
            component: () => import('@/views/dashboard/modules/DashMedias.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/series',
            name: 'dash-series',
            component: () => import('@/views/dashboard/modules/DashSeries.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/episode',
            name: 'dash-episode',
            component: () => import('@/views/dashboard/modules/DashEpisodes.vue'),
            meta: {
              permissions: [PermissionEnum.MEDIA_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/live',
            name: 'dash-live',
            component: () => import('@/views/dashboard/modules/DashLives.vue'),
            meta: {
              permissions: [PermissionEnum.LIVE_OP, PermissionEnum.ROOT_OP],
            },
          },
          {
            path: '/dashboard/file',
            name: 'dash-file',
            component: () => import('@/views/dashboard/modules/DashFiles.vue'),
            meta: {
              permissions: [PermissionEnum.FILE_OP, PermissionEnum.ROOT_OP],
            },
          },
        ],
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('@/views/Setting.vue'),
        redirect: '/setting/app',
        children: [
          {
            path: '/setting/app',
            name: 'setting-app',
            component: () => import('@/views/setting/SettingApp.vue'),
          },
          {
            path: '/setting/profile',
            name: 'setting-profile',
            component: () => import('@/views/setting/SettingProfile.vue'),
          },
        ],
      },
      {
        name: 'not-found',
        path: '/:pathMatch(.*)*',
        component: () => import('@/views/error/NotFound.vue'),
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
