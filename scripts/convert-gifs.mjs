// One-off: convert hot GIFs to H.264 MP4 (no audio, web-optimized).
// Usage: node scripts/convert-gifs.mjs
//
// Output sits next to the source. The original .gif is removed once the .mp4
// is verified non-empty. Run again safely — it'll skip any .gif that already
// has an .mp4 next to it.

import { spawnSync } from 'node:child_process';
import { statSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const ROOT = path.resolve(import.meta.dirname, '..');

// Files to convert. Skips any that aren't on disk.
const TARGETS = [
  'src/assets/bjj-grappling.gif',
  'src/assets/Rodney Mullen Skate GIF.gif',
  'src/assets/Happy Charles Oliveira GIF by UFC.gif',
  "src/assets/animation GIF by INSA's GIF-ITI.gif",
  'src/assets/do you even lift like a boss GIF.gif',
  'src/assets/ufc-search.gif',
  'src/assets/ascii-gif.gif',
  'src/assets/bear.gif',
  'src/assets/conormcgregor.gif',
  'src/assets/binder_action.gif',
  'public/projects/sinatrademo.gif',
  'public/projects/binder_action.gif',
];

let totalGifBytes = 0;
let totalMp4Bytes = 0;

for (const rel of TARGETS) {
  const gif = path.join(ROOT, rel);
  if (!existsSync(gif)) {
    console.log(`skip (missing): ${rel}`);
    continue;
  }
  const mp4 = gif.replace(/\.gif$/i, '.mp4');
  if (existsSync(mp4)) {
    console.log(`skip (already converted): ${rel}`);
    const gifSize = statSync(gif).size;
    unlinkSync(gif);
    console.log(`  removed source .gif (${(gifSize / 1024).toFixed(0)} KB freed)`);
    continue;
  }

  const gifSize = statSync(gif).size;
  totalGifBytes += gifSize;
  console.log(`convert: ${rel} (${(gifSize / 1024).toFixed(0)} KB)`);

  // -an: no audio. yuv420p + even dimensions for max compatibility.
  // -movflags +faststart so the moov atom is at the head (streamable).
  // CRF 23 is visually transparent for typical web GIF content.
  const args = [
    '-y',
    '-i', gif,
    '-an',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'slow',
    mp4,
  ];

  const result = spawnSync(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (result.status !== 0) {
    console.error(`  ffmpeg failed (status ${result.status}):`);
    console.error(result.stderr?.toString().split('\n').slice(-10).join('\n'));
    continue;
  }

  if (!existsSync(mp4) || statSync(mp4).size === 0) {
    console.error('  ffmpeg produced empty output, leaving gif in place');
    continue;
  }

  const mp4Size = statSync(mp4).size;
  totalMp4Bytes += mp4Size;
  console.log(`  -> ${(mp4Size / 1024).toFixed(0)} KB (${((1 - mp4Size / gifSize) * 100).toFixed(0)}% smaller)`);
  unlinkSync(gif);
  console.log(`  removed source .gif`);
}

if (totalGifBytes > 0) {
  console.log(`\nTotal: ${(totalGifBytes / 1024 / 1024).toFixed(2)} MB of GIFs -> ${(totalMp4Bytes / 1024 / 1024).toFixed(2)} MB of MP4s`);
  console.log(`Saved: ${((totalGifBytes - totalMp4Bytes) / 1024 / 1024).toFixed(2)} MB`);
}
