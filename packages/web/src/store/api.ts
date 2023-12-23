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
  const getToken = () => token.value;
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

  const baseUrl = import.meta.env.VITE_API_HOST;

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
    login: apiPost<AuthData, LoginDto>('/api/v1/auth/login/'),
    logout: apiPost('/api/v1/auth/logout/'),
    refreshToken: apiPost<AuthData>('/api/v1/auth/refresh'),
    bindEmail: apiPost<EmailBindData, EmailBindDto>('/api/v1/auth/email/bind'),
    verifyEmail: apiPost<EmailVerifyData, EmailVerifyDto>('/api/v1/auth/email/verify'),
    changePassword: apiPut<ChangePasswordData, ChangePasswordDto>('/api/v1/auth/password'),
    createUser: apiPost<UserEntity, CreateUserDto>('/api/v1/auth/user/create'),
    logoutUser: (id: number) => apiPost(`/api/v1/auth/user/${id}/logout`),
    changeUserPassword: (id: number) =>
      apiPut<ChangePasswordData, ChangePasswordDto>(`/api/v1/auth/user/${id}/password`),
    grantUser: (id: number) => apiPost<UserEntity, PermissionDto>(`/api/v1/auth/user/${id}/grant`),
    deleteUser: (id: number) => apiDelete(`/api/v1/auth/user/${id}`),
    getAllPermissions: apiGet<PermissionEnum[]>('/api/v1/auth/permission'),
  };

  const User = {
    getProfileById: (id: number) => apiGet<UserEntity>(`/api/v1/user/${id}/profile`),
    modifyProfileById: (id: number) => apiGet<UserEntity, UserDto>(`/api/v1/user/${id}/profile`),
    query: apiGet<ApiQueryResult<UserEntity>, UserQueryDto>('/api/v1/user'),
  };

  const File = {
    buildRawPath: (id: string, name?: string) => baseUrl + `/api/v1/file/${id}/raw/${name ?? ''}`,
    buildDownloadPath: (id: string, name?: string) => baseUrl + `/api/v1/file/${id}/download/${name ?? ''}`,
    fetchRaw: (id: string, config?: AxiosRequestConfig) => apiGet(`/api/v1/file/${id}/raw`, config),
    uploadImage: apiUpload<FileEntity>('/api/v1/file/image'),
    uploadVideo: apiUpload<FileEntity>('/api/v1/file/video'),
    query: apiGet<ApiQueryResult<FileEntity>, FileQueryDto>('/api/v1/file'),
    delete: (id: string) => apiDelete(`/api/v1/file/${id}`),
  };

  const Source = {
    create: apiPost<SourceEntity, SourceDto>('/api/v1/subscribe/source'),
    getById: (id: number) => apiGet<SourceEntity>(`/api/v1/subscribe/source/${id}`),
    query: apiGet<ApiQueryResult<SourceEntity>, SourceQueryDto>('/api/v1/subscribe/source'),
    update: (id: number) => apiPut<SourceEntity, SourceDto>(`/api/v1/subscribe/source/${id}`),
    delete: (id: number) => apiDelete(`/api/v1/subscribe/source/${id}`),
    fetchRawData: (id: number) => apiGet<FeedData>(`/api/v1/subscribe/source/${id}/raw`),
    invokeFetchJobById: (id: number) => apiPost(`/api/v1/subscribe/source/${id}/run`),
    getFetchLogsById: (id: number) =>
      apiGet<ApiQueryResult<FetchLogEntity>, FetchLogQueryDto>(`/api/v1/subscribe/source/${id}/log`),
    clearFetchLogsById: (id: number) => apiDelete(`/api/v1/subscribe/source/${id}/log`),
    getDownloadItemsById: (id: number) =>
      apiGet<ApiQueryResult<DownloadItemEntity>, DownloadItemQueryDto>(`/api/v1/subscribe/source/${id}/download`),
    clearDownloadItemsById: (id: number) => apiDelete(`/api/v1/subscribe/source/${id}/download`),
  };

  const Rule = {
    create: apiPost<RuleEntity, RuleDto>('/api/v1/subscribe/rule'),
    getById: (id: number) => apiGet<RuleEntity>(`/api/v1/subscribe/rule/${id}`),
    query: apiGet<ApiQueryResult<RuleEntity>, RuleQueryDto>('/api/v1/subscribe/rule'),
    update: (id: number) => apiPut<RuleEntity, RuleDto>(`/api/v1/subscribe/rule/${id}`),
    delete: (id: number) => apiDelete(`/api/v1/subscribe/rule/${id}`),
    getErrorLogsById: (id: number) =>
      apiGet<ApiQueryResult<RuleErrorLogEntity>, ApiQueryDto<RuleErrorLogEntity>>(`/api/v1/subscribe/rule/${id}/log`),
    clearErrorLogsById: (id: number) => apiDelete(`/api/v1/subscribe/rule/${id}/log`),
  };

  const Download = {
    create: apiPost<DownloadItemEntity, DownloadItemDto>('/api/v1/subscribe/download'),
    getById: (id: string) => apiGet<DownloadItemEntity>(`/api/v1/subscribe/download/${id}`),
    query: apiGet<ApiQueryResult<DownloadItemEntity>, DownloadItemQueryDto>('/api/v1/subscribe/download'),
    delete: (id: string) => apiDelete(`/api/v1/subscribe/download/${id}`),
    retry: (id: string) => apiPost<DownloadItemEntity>(`/api/v1/subscribe/download/${id}/retry`),
    pause: (id: string) => apiPost<DownloadItemEntity>(`/api/v1/subscribe/download/${id}/pause`),
    unpause: (id: string) => apiPost<DownloadItemEntity>(`/api/v1/subscribe/download/${id}/unpause`),
    cancel: (id: string) => apiPost<DownloadItemEntity>(`/api/v1/subscribe/download/${id}/cancel`),
  };

  const Series = {
    create: apiPost<SeriesEntity, SeriesDto>('/api/v1/series'),
    getById: (id: number) => apiGet<SeriesEntity>(`/api/v1/series/${id}`),
    update: (id: number) => apiPut<SeriesEntity, SeriesDto>(`/api/v1/series/${id}`),
    delete: (id: number) => apiDelete(`/api/v1/series/${id}`),
    query: apiGet<ApiQueryResult<SeriesEntity>, SeriesQueryDto>('/api/v1/series'),
    findSubscribe: (id: number) => apiGet<SeriesSubscribeEntity>(`/api/v1/series/${id}/subscribe`),
    addSubscribe: (id: number) => apiPost<SeriesSubscribeEntity, SeriesSubscribeDto>(`/api/v1/series/${id}/subscribe`),
    deleteSubscribe: (id: number) => apiDelete(`/api/v1/series/${id}/subscribe`),
  };

  const SeriesSubscribe = {
    getAll: apiGet<ApiQueryResult<SeriesSubscribeEntity>>('/api/v1/series/subscribe'),
    deleteAll: apiDelete('/api/v1/series/subscribe'),
  };

  const SeriesTag = {
    create: apiPost<SeriesTagEntity, SeriesTagDto>('/api/v1/series/tag'),
    delete: (id: number) => apiDelete(`/api/v1/series/tag/${id}`),
    query: apiGet<ApiQueryResult<SeriesTagEntity>, SeriesTagQueryDto>('/api/v1/series/tag'),
  };

  const Episode = {
    create: apiPost<EpisodeEntity, EpisodeDto>('/api/v1/series/episode'),
    getById: (id: number) => apiGet<EpisodeEntity>(`/api/v1/series/episode/${id}`),
    update: (id: number) => apiPut<EpisodeEntity, EpisodeDto>(`/api/v1/series/episode/${id}`),
    delete: (id: number) => apiDelete(`/api/v1/series/episode/${id}`),
    query: apiGet<ApiQueryResult<EpisodeEntity>, EpisodeQueryDto>(`/api/v1/series/episode`),
  };

  const Live = {
    socketPath: baseUrl + '/live',
    buildStreamPath: (path: string) => baseUrl + '/api/v1' + path,
    create: apiPost<LiveEntity, LiveDto>(`/api/v1/live`),
    getById: (id: string) => apiGet<LiveEntity>(`/api/v1/live/${id}`),
    query: apiGet<ApiQueryResult<LiveEntity>, LiveQueryDto>(`/api/v1/live`),
    update: (id: string) => apiPut<LiveEntity, LiveDto>(`/api/v1/live/${id}`),
    delete: (id: string) => apiDelete(`/api/v1/live/${id}`),
  };

  const Media = {
    create: apiPost<MediaEntity, MediaDto>(`/api/v1/media`),
    getById: (id: string) => apiGet<MediaEntity>(`/api/v1/media/${id}`),
    query: apiGet<ApiQueryResult<MediaEntity>, MediaQueryDto>(`/api/v1/media`),
    update: (id: string) => apiPut<MediaEntity, MediaDto>(`/api/v1/media/${id}`),
    delete: (id: string) => apiDelete(`/api/v1/media/${id}`),
    findHistory: (id: number) => apiGet<ViewHistoryEntity>(`/api/v1/media/${id}/history`),
    addHistory: (id: number) => apiPost<ViewHistoryEntity, ViewHistoryDto>(`/api/v1/media/${id}/history`),
    deleteHistory: (id: number) => apiDelete(`/api/v1/media/${id}/history`),
  };

  const ViewHistory = {
    getAll: apiGet<ApiQueryResult<ViewHistoryEntity>>('/api/v1/media/history'),
    deleteAll: apiDelete('/api/v1/media/history'),
  };

  const System = {
    getStatus: apiGet<SystemStatus>('/api/v1/system/status'),
  };

  return {
    isLogin,
    getToken,
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
