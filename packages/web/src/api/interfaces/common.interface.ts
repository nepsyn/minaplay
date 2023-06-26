export interface ApiError {
  code: number;
  message: string;
}

export type ApiQueryDto<T> = {
  page?: number;
  size?: number;
  sort?: keyof T;
  order: 'ASC' | 'DESC';
};
