import { reactive } from 'vue';

export interface ItemsLoaderState<T = any> {
  loading: boolean;
  page: number;
  size: number;
  total: number;
  all: boolean;
  items: T[];
  loadFn: Function;
  reset: Function;
}

export function createItemsLoaderState<T>(options: Partial<ItemsLoaderState<T>>) {
  return reactive({
    loading: options.loading ?? false,
    page: options.page ?? 0,
    size: options.size ?? 20,
    total: options.total ?? 0,
    all: options.all ?? false,
    items: options.items ?? [],
    loadFn: options.loadFn,
    reset: function () {
      this.page = 0;
      this.total = 0;
      this.all = false;
      this.items = [];
    },
  });
}

export interface SingleItemLoaderState<T = any> {
  loading: boolean;
  first: boolean;
  item: T;
  loadFn: Function;
  reset: Function;
}

export function createSingleItemLoaderState<T>(options: Partial<SingleItemLoaderState<T>>) {
  return reactive({
    loading: options.loading ?? false,
    first: options.first ?? true,
    item: options.item ?? undefined,
    loadFn: options.loadFn,
    reset: function () {
      this.first = true;
      this.item = undefined;
    },
  });
}
