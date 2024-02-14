export async function resolve(specifier: string, context: object, nextResolve: Function) {
  return nextResolve(specifier.replace('@minaplay/server', '../..'), context);
}
