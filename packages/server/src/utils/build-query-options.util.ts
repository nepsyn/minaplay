import { FindOperator, FindOptionsWhere, Like } from 'typeorm';

type EntityKeys<T> = { [K in keyof T]: K };

interface QueryOptions<T> {
  keyword?: string;
  keywordProperties?: (keyof T)[] | ((entity: EntityKeys<T>) => (keyof T)[]);
  exact?: FindOptionsWhere<T>;
}

function removeUndefinedProperties(obj: any): any {
  if (typeof obj !== 'object' || obj === null || obj instanceof FindOperator) {
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
  const exact = removeUndefinedProperties(options.exact ?? {});

  options.keywordProperties ??= [];
  const props =
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

  if (options.keyword && props.length > 0) {
    for (const property of props) {
      conditions.push({
        [property]: Like(`%${options.keyword}%`),
        ...exact,
      } as any);
    }
  } else if (Object.keys(exact).length > 0) {
    conditions.push(exact);
  }

  return conditions;
}
