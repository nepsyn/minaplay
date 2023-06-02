import { FindOptionsWhere, Like } from 'typeorm';

type EntityKeys<T> = { [K in keyof T]: K };

interface QueryOptions<T> {
  keyword?: string;
  keywordProperties?: (keyof T)[] | ((entity: EntityKeys<T>) => (keyof T)[]);
  exact?: FindOptionsWhere<T>;
}

export function buildQueryOptions<T>(options: QueryOptions<T>): FindOptionsWhere<T>[] {
  const conditions: FindOptionsWhere<T>[] = [];

  if (options.exact) {
    Object.keys(options.exact).forEach((key) => {
      if (options.exact[key] === undefined) {
        delete options.exact[key];
      }
    });
    if (Object.keys(options.exact).length === 0) {
      options.exact = undefined;
    }
  }

  if (options.keyword && options.keywordProperties) {
    const keywordProperties =
      typeof options.keywordProperties === 'function'
        ? options.keywordProperties(
            new Proxy(
              {},
              {
                get(target, key: string | symbol) {
                  return key;
                },
              },
            ) as EntityKeys<T>,
          )
        : options.keywordProperties;

    for (const property of keywordProperties) {
      conditions.push({
        [property]: Like(`%${options.keyword}%`),
        ...options.exact,
      });
    }
  } else if (options.exact) {
    conditions.push(options.exact);
  }

  return conditions;
}
