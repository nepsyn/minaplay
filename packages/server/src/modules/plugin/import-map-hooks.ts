import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier: string, context: object, nextResolve: Function) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const base = pathToFileURL(path.join(__dirname, '../../..'));
  return nextResolve(specifier.replace('@minaplay/server', base.href), context);
}
