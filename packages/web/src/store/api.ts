import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import {
  AuthData,
  ChangePasswordData,
  ChangePasswordDto,
  CreateUserDto,
  EmailBindData,
  EmailBindDto,
  EmailVerifyData,
  EmailVerifyDto,
  LoginDto,
  PermissionDto,
} from '@/api/interfaces/auth.interface';
import { UserDto, UserEntity, UserQueryDto } from '@/api/interfaces/user.interface';
import { PermissionEnum } from '@/api/enums/permission.enum';
import {
  DownloadItemDto,
  DownloadItemEntity,
  DownloadItemQueryDto,
  FeedData,
  FetchLogEntity,
  FetchLogQueryDto,
  RuleDto,
  RuleEntity,
  RuleErrorLogEntity,
  RuleQueryDto,
  SourceDto,
  SourceEntity,
  SourceQueryDto,
} from '@/api/interfaces/subscribe.interface';
import { ApiQueryDto, ApiQueryResult } from '@/api/interfaces/common.interface';
import {
  EpisodeDto,
  EpisodeEntity,
  EpisodeQueryDto,
  SeriesDto,
  SeriesEntity,
  SeriesQueryDto,
  SeriesSubscribeDto,
  SeriesSubscribeEntity,
  SeriesTagDto,
  SeriesTagEntity,
  SeriesTagQueryDto,
} from '@/api/interfaces/series.interface';
import {
  MediaDto,
  MediaEntity,
  MediaQueryDto,
  ViewHistoryDto,
  ViewHistoryEntity,
} from '@/api/interfaces/media.interface';
import { FileQueryDto } from '@/api/interfaces/file.interface';
import { SystemStatus } from '@/api/interfaces/system.interface';
import { LiveDto, LiveEntity, LiveQueryDto } from '@/api/interfaces/live.interface';

export const useApiStore = defineStore('api', () => {
  const user = ref<UserEntity | undefined>(undefined);
  const hasPermission = (...permissions: PermissionEnum[]) => {
    return user.value && permissions.some((name) => user.value?.permissionNames.includes(name));
  };

  const token = ref<string | undefined | null>(localStorage.getItem('minaplay-token'));
  const isLogin = computed(() => token.value != null);
  const setToken = (value?: string) => {
    token.value = value;
    if (value == null) {
      localStorage.removeItem('minaplay-token');
      localStorage.removeItem('minaplay-user');
    } else {
      try {
        const payload: { id: number } = JSON.parse(atob(value.split('.')[1]));
        localStorage.setItem('minaplay-user', String(payload.id));
      } catch {}
      localStorage.setItem('minaplay-token', value);
    }
  };
  axios.interceptors.request.use(
    (config) => {
      if (token.value) {
        config.headers.authorization = `Bearer ${token.value}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  const baseUrl = import.meta.env.VITE_BASE_URL;

  function apiGet<T = any, Params = any>(url: string, config: AxiosRequestConfig = {}) {
    return (params?: Params) => axios.get<T>(baseUrl + url, { params, ...config });
  }

  function apiPost<T = any, Data = any>(url: string, config: AxiosRequestConfig = {}) {
    return (data?: Data) => axios.post<T>(baseUrl + url, data, config);
  }

  function apiPut<T = any, Data = any>(url: string, config: AxiosRequestConfig = {}) {
    return (data?: Data) => axios.put<T>(baseUrl + url, data, config);
  }

  function apiDelete<T = any, Params = any>(url: string, config: AxiosRequestConfig = {}) {
    return (params?: Params) => axios.delete<T>(baseUrl + url, { params, ...config });
  }

  function apiUpload<T = any>(url: string) {
    return (file: File, onProgress?: (event: AxiosProgressEvent) => any, signal?: AbortSignal) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post<T>(baseUrl + url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
        signal,
      });
    };
  }

  const Auth = {
    login: apiPost<AuthData, LoginDto>('/auth/login/'),
    logout: apiPost('/auth/logout/'),
    refreshToken: apiPost<AuthData>('/auth/refresh'),
    bindEmail: apiPost<EmailBindData, EmailBindDto>('/auth/email/bind'),
    verifyEmail: apiPost<EmailVerifyData, EmailVerifyDto>('/auth/email/verify'),
    changePassword: apiPut<ChangePasswordData, ChangePasswordDto>('/auth/password'),
    createUser: apiPost<UserEntity, CreateUserDto>('/auth/user/create'),
    logoutUser: (id: number) => apiPost(`/auth/user/${id}/logout`),
    changeUserPassword: (id: number) => apiPut<ChangePasswordData, ChangePasswordDto>(`/auth/user/${id}/password`),
    grantUser: (id: number) => apiPost<UserEntity, PermissionDto>(`/auth/user/${id}/grant`),
    deleteUser: (id: number) => apiDelete(`/auth/user/${id}`),
    getAllPermissions: apiGet<PermissionEnum[]>('/auth/permission'),
  };

  const User = {
    getProfileById: (id: number) => apiGet<UserEntity>(`/user/${id}/profile`),
    modifyProfileById: (id: number) => apiGet<UserEntity, UserDto>(`/user/${id}/profile`),
    query: apiGet<ApiQueryResult<UserEntity>, UserQueryDto>('/user'),
  };

  const File = {
    buildRawPath: (id: string, name?: string) => baseUrl + `/file/${id}/raw/${name ?? ''}`,
    buildDownloadPath: (id: string, name?: string) => baseUrl + `/file/${id}/download/${name ?? ''}`,
    fetchRaw: (id: string, config?: AxiosRequestConfig) => apiGet(`/file/${id}/raw`, config),
    uploadImage: apiUpload<FileEntity>('/file/image'),
    uploadVideo: apiUpload<FileEntity>('/file/video'),
    query: apiGet<ApiQueryResult<FileEntity>, FileQueryDto>('/file'),
    delete: (id: string) => apiDelete(`/file/${id}`),
  };

  const Source = {
    create: apiPost<SourceEntity, SourceDto>('/subscribe/source'),
    getById: (id: number) => apiGet<SourceEntity>(`/subscribe/source/${id}`),
    query: apiGet<ApiQueryResult<SourceEntity>, SourceQueryDto>('/subscribe/source'),
    update: (id: number) => apiPut<SourceEntity, SourceDto>(`/subscribe/source/${id}`),
    delete: (id: number) => apiDelete(`/subscribe/source/${id}`),
    fetchRawData: (id: number) => apiGet<FeedData>(`/subscribe/source/${id}/raw`),
    invokeFetchJobById: (id: number) => apiPost(`/subscribe/source/${id}/run`),
    getFetchLogsById: (id: number) =>
      apiGet<ApiQueryResult<FetchLogEntity>, FetchLogQueryDto>(`/subscribe/source/${id}/log`),
    clearFetchLogsById: (id: number) => apiDelete(`/subscribe/source/${id}/log`),
    getDownloadItemsById: (id: number) =>
      apiGet<ApiQueryResult<DownloadItemEntity>, DownloadItemQueryDto>(`/subscribe/source/${id}/download`),
    clearDownloadItemsById: (id: number) => apiDelete(`/subscribe/source/${id}/download`),
  };

  const Rule = {
    create: apiPost<RuleEntity, RuleDto>('/subscribe/rule'),
    getById: (id: number) => apiGet<RuleEntity>(`/subscribe/rule/${id}`),
    query: apiGet<ApiQueryResult<RuleEntity>, RuleQueryDto>('/subscribe/rule'),
    update: (id: number) => apiPut<RuleEntity, RuleDto>(`/subscribe/rule/${id}`),
    delete: (id: number) => apiDelete(`/subscribe/rule/${id}`),
    getErrorLogsById: (id: number) =>
      apiGet<ApiQueryResult<RuleErrorLogEntity>, ApiQueryDto<RuleErrorLogEntity>>(`/subscribe/rule/${id}/log`),
    clearErrorLogsById: (id: number) => apiDelete(`/subscribe/rule/${id}/log`),
  };

  const Download = {
    create: apiPost<DownloadItemEntity, DownloadItemDto>('/subscribe/download'),
    getById: (id: string) => apiGet<DownloadItemEntity>(`/subscribe/download/${id}`),
    query: apiGet<ApiQueryResult<DownloadItemEntity>, DownloadItemQueryDto>('/subscribe/download'),
    delete: (id: string) => apiDelete(`/subscribe/download/${id}`),
    retry: (id: string) => apiPost<DownloadItemEntity>(`/subscribe/download/${id}/retry`),
    pause: (id: string) => apiPost<DownloadItemEntity>(`/subscribe/download/${id}/pause`),
    unpause: (id: string) => apiPost<DownloadItemEntity>(`/subscribe/download/${id}/unpause`),
    cancel: (id: string) => apiPost<DownloadItemEntity>(`/subscribe/download/${id}/cancel`),
  };

  const Series = {
    create: apiPost<SeriesEntity, SeriesDto>('/series'),
    getById: (id: number) => apiGet<SeriesEntity>(`/series/${id}`),
    update: (id: number) => apiPut<SeriesEntity, SeriesDto>(`/series/${id}`),
    delete: (id: number) => apiDelete(`/series/${id}`),
    query: apiGet<ApiQueryResult<SeriesEntity>, SeriesQueryDto>('/series'),
    findSubscribe: (id: number) => apiGet<SeriesSubscribeEntity>(`/series/${id}/subscribe`),
    addSubscribe: (id: number) => apiPost<SeriesSubscribeEntity, SeriesSubscribeDto>(`/series/${id}/subscribe`),
    deleteSubscribe: (id: number) => apiDelete(`/series/${id}/subscribe`),
  };

  const SeriesSubscribe = {
    getAll: apiGet<ApiQueryResult<SeriesSubscribeEntity>>('/series/subscribe'),
    deleteAll: apiDelete('/series/subscribe'),
  };

  const SeriesTag = {
    create: apiPost<SeriesTagEntity, SeriesTagDto>('/series/tag'),
    delete: (id: number) => apiDelete(`/series/tag/${id}`),
    query: apiGet<ApiQueryResult<SeriesTagEntity>, SeriesTagQueryDto>('/series/tag'),
  };

  const Episode = {
    create: apiPost<EpisodeEntity, EpisodeDto>('/series/episode'),
    getById: (id: number) => apiGet<EpisodeEntity>(`/series/episode/${id}`),
    update: (id: number) => apiPut<EpisodeEntity, EpisodeDto>(`/series/episode/${id}`),
    delete: (id: number) => apiDelete(`/series/episode/${id}`),
    query: apiGet<ApiQueryResult<EpisodeEntity>, EpisodeQueryDto>(`/series/episode`),
  };

  const Live = {
    create: apiPost<LiveEntity, LiveDto>(`/live`),
    getById: (id: string) => apiGet<LiveEntity>(`/live/${id}`),
    query: apiGet<ApiQueryResult<LiveEntity>, LiveQueryDto>(`/live`),
    update: (id: string) => apiPut<LiveEntity, LiveDto>(`/live/${id}`),
    delete: (id: string) => apiDelete(`/live/${id}`),
  };

  const Media = {
    create: apiPost<MediaEntity, MediaDto>(`/media`),
    getById: (id: string) => apiGet<MediaEntity>(`/media/${id}`),
    query: apiGet<ApiQueryResult<MediaEntity>, MediaQueryDto>(`/media`),
    update: (id: string) => apiPut<MediaEntity, MediaDto>(`/media/${id}`),
    delete: (id: string) => apiDelete(`/media/${id}`),
    findHistory: (id: number) => apiGet<ViewHistoryEntity>(`/media/${id}/history`),
    addHistory: (id: number) => apiPost<ViewHistoryEntity, ViewHistoryDto>(`/media/${id}/history`),
    deleteHistory: (id: number) => apiDelete(`/media/${id}/history`),
  };

  const ViewHistory = {
    getAll: apiGet<ApiQueryResult<ViewHistoryEntity>>('/media/history'),
    deleteAll: apiDelete('/media/history'),
  };

  const System = {
    getStatus: apiGet<SystemStatus>('/system/status'),
  };

  return {
    isLogin,
    setToken,
    user,
    hasPermission,
    Auth,
    User,
    File,
    Source,
    Rule,
    Download,
    Series,
    SeriesSubscribe,
    SeriesTag,
    Episode,
    Live,
    Media,
    ViewHistory,
    System,
  };
});
