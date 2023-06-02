import { Readable } from 'stream';
import { createHash } from 'crypto';

export function generateMD5(chunk: Readable | string): Promise<string> {
  return new Promise<string>((resolve) => {
    const hash = createHash('md5');
    if (typeof chunk === 'string') {
      resolve(hash.update(chunk).digest('hex'));
    } else {
      chunk.on('data', (chunk) => {
        hash.update(chunk);
      });
      chunk.on('end', () => {
        resolve(hash.digest('hex'));
      });
    }
  });
}
