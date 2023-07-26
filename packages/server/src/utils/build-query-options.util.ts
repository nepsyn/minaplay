import { FindOptionsWhere, Like } from 'typeorm';

type EntityKeys<T> = { [K in keyof T]: K };

interface QueryOptions<T> {
  keyword?: string;
  keywordProperties?: (keyof T)[] | ((entity: EntityKeys<T>) => (keyof T)[]);
  exact?: FindOptionsWhere<T>;
}

function removeUndefinedProperties(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedProperties);
  }

  const cleanedObj: any = {};
  Object.entries(obj).forEach(([key, value]) => {
    const cleanedValue = removeUndefinedProperties(value);
    if (
      (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length > 0) ||
      (typeof cleanedValue !== 'object' && cleanedValue !== undefined)
    ) {
      cleanedObj[key] = cleanedValue;
    }
  });

  return cleanedObj;
}

export function buildQueryOptions<T>(options: QueryOptions<T>): FindOptionsWhere<T>[] {
  const conditions: FindOptionsWhere<T>[] = [];

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
      } as any);
    }
  } else if (options.exact) {
    const cleaned = removeUndefinedProperties(options.exact);
    if (Object.keys(cleaned).length > 0) {
      conditions.push(cleaned);
    }
  }

  return conditions;
}
