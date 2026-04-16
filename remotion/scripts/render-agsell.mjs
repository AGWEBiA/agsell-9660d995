import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compId = process.argv[2] || 'agsell-presentation';
const outFile = process.argv[3] || `/dev-server/public/videos/${compId}.mp4`;

console.log(`Bundling for "${compId}"...`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, '../src/index.ts'),
  webpackOverride: (c) => c,
});

const browser = await openBrowser('chrome', {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/bin/chromium',
  chromiumOptions: { args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] },
  chromeMode: 'chrome-for-testing',
});

const composition = await selectComposition({ serveUrl: bundled, id: compId, puppeteerInstance: browser });
console.log(`Rendering ${composition.durationInFrames} frames @ ${composition.fps}fps -> ${outFile}`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: outFile,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  onProgress: ({ progress }) => {
    if (Math.floor(progress * 100) % 10 === 0) process.stdout.write(`${Math.floor(progress * 100)}% `);
  },
});

await browser.close({ silent: false });
console.log('\nVideo (no audio) rendered. Now muxing audio...');
