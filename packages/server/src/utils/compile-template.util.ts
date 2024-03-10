import path from 'node:path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';

export async function compileTemplate(file: string, searchDirs: string[]) {
  const candidates = searchDirs.map((dir) => path.join(dir, file));

  for (const candidate of candidates) {
    if (await fs.exists(candidate)) {
      const code = await fs.readFile(candidate);
      return Handlebars.compile(code.toString());
    }
  }

  return null;
}
