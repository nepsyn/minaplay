import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { AuthData, LoginDto } from '@/interfaces/auth.interface';
import { FileEntity } from '@/interfaces/file.interface';
import {
  DownloadItemEntity,
  DownloadItemQueryDto,
  FeedData,
  FetchLogEntity,
  FetchLogQueryDto,
  RuleDto,
  RuleEntity,
  RuleQueryDto,
  SourceDto,
  SourceEntity,
  SourceQueryDto,
} from '@/interfaces/subscribe.interface';
import { ApiQueryResult } from '@/interfaces/common.interface';
import { MediaDto, MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';

class ApiHelper {
  private token: string | null = null;

  constructor(private baseUrl: string) {
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers = config.headers || {};
          config.headers.authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  get isLogin() {
    return this.token != null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private apiGet<T = any, Params = any>(url: string, config: AxiosRequestConfig = {}) {
    return (params?: Params) => axios.get<T>(this.baseUrl + url, { params, ...config });
  }

  private apiPost<T = any, Data = any>(url: string, config: AxiosRequestConfig = {}) {
    return (data?: Data) => axios.post<T>(this.baseUrl + url, data, config);
  }

  private apiPut<T = any, Data = any>(url: string, config: AxiosRequestConfig = {}) {
    return (data?: Data) => axios.put<T>(this.baseUrl + url, data, config);
  }

  private apiDelete<T = any, Params = any>(url: string, config: AxiosRequestConfig = {}) {
    return (params?: Params) => axios.delete<T>(this.baseUrl + url, { params, ...config });
  }

  private apiUpload<T = any>(url: string) {
    return (file: File, onProgress?: (event: AxiosProgressEvent) => any, signal?: AbortSignal) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post<T>(this.baseUrl + url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
        signal,
      });
    };
  }

  Auth = {
    login: this.apiPost<AuthData, LoginDto>('/auth/login/'),
    logout: this.apiPost('/auth/logout/'),
    refreshToken: this.apiPost<AuthData>('/auth/refresh'),
  };

  File = {
    buildRawPath: (id: string) => `${this.baseUrl}/file/${id}/raw`,
    fetchRaw: (id: string, config?: AxiosRequestConfig) => this.apiGet(`/file/${id}/raw`, config),
    uploadImage: this.apiUpload<FileEntity>('/file/image'),
    uploadVideo: this.apiUpload<FileEntity>('/file/video'),
  };

  SubscribeSource = {
    create: this.apiPost<SourceEntity, SourceDto>('/subscribe'),
    getById: (id: number) => this.apiGet(`/subscribe/${id}`),
    query: this.apiGet<ApiQueryResult<SourceEntity>, SourceQueryDto>('/subscribe'),
    update: (id: number) => this.apiPut<SourceEntity, SourceDto>(`/subscribe/${id}`),
    delete: (id: number) => this.apiDelete(`/subscribe/${id}`),
    fetchRawData: (id: number) => this.apiGet<FeedData>(`/subscribe/${id}/raw`),
    invokeFetchJobById: (id: number) => this.apiPost(`/subscribe/${id}/run`),
    getRulesById: (id: number) => this.apiGet<ApiQueryResult<RuleEntity>, RuleQueryDto>(`/subscribe/${id}/rule`),
    getFetchLogsById: (id: number) =>
      this.apiGet<ApiQueryResult<FetchLogEntity>, FetchLogQueryDto>(`/subscribe/${id}/log`),
    getDownloadItemsById: (id: number) =>
      this.apiGet<ApiQueryResult<DownloadItemEntity>, DownloadItemQueryDto>(`/subscribe/${id}/download`),
  };

  SubscribeRule = {
    create: this.apiPost<RuleEntity, RuleDto>(`/rule`),
    query: this.apiGet<ApiQueryResult<RuleEntity>, RuleQueryDto>('/rule'),
    update: (id: number) => this.apiPut<RuleEntity, RuleDto>(`/rule/${id}`),
    delete: (id: number) => this.apiDelete(`/rule/${id}`),
  };

  Media = {
    create: this.apiPost<MediaEntity, MediaDto>(`/media`),
    getById: (id: string) => this.apiGet<MediaEntity>(`/media/${id}`),
    query: this.apiGet<ApiQueryResult<MediaEntity>, MediaQueryDto>(`/media`),
    update: (id: number) => this.apiPut<MediaEntity, MediaDto>(`/media/${id}`),
    delete: (id: number) => this.apiDelete(`/media/${id}`),
  };
}

export const Api = new ApiHelper(import.meta.env.VITE_BASE_URL);
