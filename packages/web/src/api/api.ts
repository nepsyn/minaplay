import axios, { AxiosProgressEvent } from 'axios';
import { AuthData, LoginDto } from './interfaces/auth.interface';
import { FileEntity } from './interfaces/file.interface';
import {
  SubscribeRuleDto,
  SubscribeRuleEntity,
  SubscribeSourceDto,
  SubscribeSourceEntity,
} from './interfaces/subscribe.interface';
import { ApiQueryDto } from './interfaces/common.interface';

class ApiHelper {
  Auth = {
    login: this.apiPost<AuthData, LoginDto>('/auth/login/'),
    logout: this.apiPost('/auth/logout/'),
  };
  File = {
    uploadImage: this.apiUpload<FileEntity>('/file/image/upload/'),
    uploadVideo: this.apiUpload<FileEntity>('/file/video/upload/'),
  };
  Subscribe = {
    createSource: this.apiPost<SubscribeSourceEntity, SubscribeSourceDto>('/subscribe'),
    getSourceById: (id: number) => this.apiGet(`/subscribe/${id}`),
    querySource: this.apiGet<SubscribeSourceEntity[], ApiQueryDto<SubscribeSourceEntity>>('/subscribe'),
    updateSource: (id: number) => this.apiPut<SubscribeSourceEntity, SubscribeSourceDto>(`/subscribe/${id}`),
    deleteSource: (id: number) => this.apiDelete(`/subscribe/${id}`),
    fetchRawData: (id: number) => this.apiPost<object>(`/subscribe/${id}/raw`),
    createRule: (sourceId: number) =>
      this.apiPost<SubscribeRuleEntity, SubscribeRuleDto>(`/subscribe/${sourceId}/rule`),
    getRuleBySourceId: (sourceId: number) => this.apiGet<SubscribeRuleEntity[]>(`/subscribe/${sourceId}/rule`),
    queryRule: this.apiGet<SubscribeRuleEntity[], ApiQueryDto<SubscribeRuleEntity>>('/subscribe/rule'),
    updateRule: (id: number) => this.apiPut(`/subscribe/rule/${id}`),
    deleteRule: (id: number) => this.apiDelete(`/subscribe/rule/${id}`),
  };
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

  private apiGet<T = any, Params = any>(url: string) {
    return (params?: Params) => axios.get<T>(this.baseUrl + url, { params });
  }

  private apiPost<T = any, Data = any>(url: string) {
    return (data?: Data) => axios.post<T>(this.baseUrl + url, data);
  }

  private apiPut<T = any, Data = any>(url: string) {
    return (data?: Data) => axios.put<T>(this.baseUrl + url, data);
  }

  private apiDelete<T = any, Params = any>(url: string) {
    return (params?: Params) => axios.delete<T>(this.baseUrl + url, { params });
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
}

export const Api = new ApiHelper(import.meta.env.VITE_BASE_URL);
