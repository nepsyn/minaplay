import axios, { AxiosProgressEvent } from 'axios';
import { AuthData } from './interfaces/auth.interface';
import { FileEntity } from './interfaces/file.interface';

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

  private apiGet<T = any>(url: string) {
    return (params?: any) => axios.get<T>(this.baseUrl + url, { params });
  }

  private apiPost<T = any>(url: string) {
    return (data?: any) => axios.post<T>(this.baseUrl + url, data);
  }

  private apiPut<T = any>(url: string) {
    return (data?: any) => axios.put<T>(this.baseUrl + url, data);
  }

  private apiDelete<T = any>(url: string) {
    return (params?: any) => axios.delete<T>(this.baseUrl + url, { params });
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
    login: this.apiPost<AuthData>('/auth/login/'),
    logout: this.apiPost('/auth/logout/'),
  };

  File = {
    uploadImage: this.apiUpload<FileEntity>('/file/image/upload/'),
    uploadVideo: this.apiUpload<FileEntity>('/file/video/upload/'),
  };

  Subscribe = {};
}

export const Api = new ApiHelper(import.meta.env.VITE_BASE_URL);
