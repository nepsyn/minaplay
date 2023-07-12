export const importDynamic: <T = any>(modulePath: string) => Promise<T> = new Function(
  'modulePath',
  'return import(modulePath)',
) as any;
