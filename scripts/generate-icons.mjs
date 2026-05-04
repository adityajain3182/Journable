// Generates PWA icon PNGs from public/icon-source.svg.
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = readFileSync(resolve(root, 'public/icon-source.svg'));

async function render(input, outName, size) {
  await sharp(input, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } })
    .png()
    .toFile(resolve(root, 'public', outName));
  console.log('  ✓', outName, `(${size}x${size})`);
}

async function renderMaskable(input, outName, size) {
  // Maskable icons must keep their meaningful content within the centre 80%.
  // We render the source at 80% size, then extend the canvas with the brand
  // background so launchers can crop into any shape (circle, squircle, etc.)
  // without clipping the J.
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const innerBuf = await sharp(input, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 5, g: 5, b: 5, alpha: 1 } },
  })
    .composite([{ input: innerBuf, top: pad, left: pad }])
    .png()
    .toFile(resolve(root, 'public', outName));
  console.log('  ✓', outName, `(${size}x${size}, maskable)`);
}

console.log('Generating PWA icons from public/icon-source.svg…');
await render(src, 'pwa-192.png', 192);
await render(src, 'pwa-512.png', 512);
await renderMaskable(src, 'pwa-maskable-512.png', 512);
await render(src, 'apple-touch-icon.png', 180);
await render(src, 'favicon.png', 32);
console.log('Done.');
