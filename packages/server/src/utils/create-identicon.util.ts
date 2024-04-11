import fs from 'fs-extra';
import sharp from 'sharp';

export async function createIdenticon(hash: string, path: string) {
  const size = 256;
  const cell = Math.floor((size - Math.floor(size * 0.08) * 2) / 5);
  const margin = Math.floor((size - cell * 5) / 2);

  const identicon = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#F0F0F0',
    },
  });

  const hue = parseInt(hash.substring(hash.length - 7), 16) / 0xfffffff;
  const fg = hls2rgb(hue, 0.7, 0.5);
  const fgTile = await sharp({
    create: {
      width: cell,
      height: cell,
      channels: 4,
      background: fg,
    },
  })
    .png()
    .toBuffer();
  const bg = '#F0F0F0';
  const bgTile = await sharp({
    create: {
      width: cell,
      height: cell,
      channels: 4,
      background: bg,
    },
  })
    .png()
    .toBuffer();

  const layers = [];
  for (let i = 0; i < 15; i++) {
    const tile = parseInt(hash.charAt(i), 16) % 2 ? bgTile : fgTile;
    if (i < 5) {
      layers.push({
        input: tile,
        blend: 'atop',
        top: 2 * cell + margin,
        left: i * cell + margin,
      });
    } else if (i < 10) {
      layers.push(
        {
          input: tile,
          blend: 'atop',
          top: cell + margin,
          left: (i - 5) * cell + margin,
        },
        {
          input: tile,
          blend: 'atop',
          top: 3 * cell + margin,
          left: (i - 5) * cell + margin,
        },
      );
    } else if (i < 15) {
      layers.push(
        {
          input: tile,
          blend: 'atop',
          top: margin,
          left: (i - 10) * cell + margin,
        },
        {
          input: tile,
          blend: 'atop',
          top: 4 * cell + margin,
          left: (i - 10) * cell + margin,
        },
      );
    }
  }

  const data = await identicon.composite(layers).png().toBuffer();
  await fs.ensureFile(path);
  await fs.writeFile(path, data);
}

function hls2rgb(h: number, s: number, b: number) {
  h *= 6;
  const c = [(b += s *= b < 0.5 ? b : 1 - b), b - (h % 1) * s * 2, (b -= s *= 2), b, b + (h % 1) * s, b + s];

  return {
    r: c[~~h % 6] * 255,
    g: c[(h | 16) % 6] * 255,
    b: c[(h | 8) % 6] * 255,
  };
}
