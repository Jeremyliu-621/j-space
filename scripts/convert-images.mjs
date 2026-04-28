// Convert large JPG/PNG to WebP and resize to a sane web dimension.
// Source files >200KB get re-encoded; everything below stays as-is.
//
// Usage: node scripts/convert-images.mjs

import { readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCAN_DIRS = [
  'src/assets',
  'public/art',
  'public/me',
  'public/sports',
  'public/projects',
];
const MIN_BYTES = 200 * 1024; // 200 KB
const MAX_DIM = 1600;          // px — any larger gets downscaled
const QUALITY = 82;
const RASTER_RE = /\.(jpe?g|png)$/i;

function listAll(rel) {
  const abs = path.join(ROOT, rel);
  let entries;
  try { entries = readdirSync(abs); } catch { return []; }
  return entries
    .map((e) => path.join(rel, e))
    .filter((r) => RASTER_RE.test(r) && statSync(path.join(ROOT, r)).isFile());
}

let totalIn = 0;
let totalOut = 0;
const renames = []; // { from: 'almond-blossoms.jpg', to: 'almond-blossoms.webp' }

for (const dir of SCAN_DIRS) {
  for (const rel of listAll(dir)) {
    const abs = path.join(ROOT, rel);
    const inSize = statSync(abs).size;
    if (inSize < MIN_BYTES) continue;

    const outRel = rel.replace(RASTER_RE, '.webp');
    const outAbs = path.join(ROOT, outRel);

    try {
      const img = sharp(abs);
      const meta = await img.metadata();
      const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
      let pipeline = img;
      if (longest > MAX_DIM) {
        pipeline = pipeline.resize({
          width: meta.width >= meta.height ? MAX_DIM : undefined,
          height: meta.height > meta.width ? MAX_DIM : undefined,
          withoutEnlargement: true,
        });
      }
      await pipeline.webp({ quality: QUALITY, effort: 5 }).toFile(outAbs);
    } catch (err) {
      console.error(`fail: ${rel} -> ${err.message}`);
      continue;
    }

    const outSize = statSync(outAbs).size;
    totalIn += inSize;
    totalOut += outSize;
    console.log(`${rel}  ${(inSize / 1024).toFixed(0)}K -> ${outRel}  ${(outSize / 1024).toFixed(0)}K  (${((1 - outSize / inSize) * 100).toFixed(0)}% smaller)`);

    unlinkSync(abs);
    renames.push({
      from: path.basename(rel),
      to: path.basename(outRel),
      fromPublic: rel.startsWith('public/') ? rel.replace(/^public/, '') : null,
      toPublic: rel.startsWith('public/') ? outRel.replace(/^public/, '') : null,
    });
  }
}

console.log(`\nTotal: ${(totalIn / 1024 / 1024).toFixed(2)} MB -> ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
console.log(`Saved: ${((totalIn - totalOut) / 1024 / 1024).toFixed(2)} MB`);

console.log('\nRenames (for reference):');
for (const r of renames) console.log(`  ${r.from}  ->  ${r.to}`);
