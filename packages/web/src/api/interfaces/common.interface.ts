export interface ApiError {
  code: number;
  message: string;
}

export interface ApiQueryDto<T = any> {
  page?: number;
  size?: number;
  sort?: `${keyof T & string}:${'ASC' | 'DESC'}` | `${keyof T & string}:${'ASC' | 'DESC'}`[];
}

export interface ApiQueryResult<T = any> {
  items: T[];
  page: number;
  size: number;
  total: number;
}
