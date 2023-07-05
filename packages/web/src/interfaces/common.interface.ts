export interface ApiError {
  code: number;
  message: string;
}

export type ApiQueryDto<T> = {
  page?: number;
  size?: number;
  sort?: keyof T;
  order?: 'ASC' | 'DESC';
};

export type ApiQueryResult<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

export interface SingleItemState<T = any> {
  item: T | undefined;
  first: boolean;
}

export interface MultiItemsState<T = any> {
  items: Map<any, T>;
  total: number;
  all: boolean;
}
