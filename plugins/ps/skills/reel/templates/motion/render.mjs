// Frame-accurate renderer for Stage-based (Claude Design–style) animations.
// Opens each job in headless Chrome, seeks the playhead frame by frame
// (window.__seek), screenshots with a transparent background and pipes the PNGs to
// ffmpeg → ProRes 4444 with alpha. Works for our scenes and for any HTML animation
// that exposes window.__seek + window.__videoMeta (e.g. a Claude Design export).
//
// Job: {kind: "video"|"still", out, props?, url?, frame?, duration?}
//   props → our index.html renders a Beat/Cover from them;  url → an external HTML file
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(fileURLToPath(import.meta.url));
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const exe = process.env.REEL_BROWSER;
if (!exe) {
  console.error('REEL_BROWSER not set — run setup.sh');
  process.exit(2);
}
const shell = /headless[_-]shell/.test(exe);
const workers = Number(process.env.REEL_CONCURRENCY || 0) || Math.max(1, Math.floor(os.cpus().length / 2));
const ffmpegBin = process.env.REEL_FFMPEG || 'ffmpeg';

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: shell ? 'shell' : true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--allow-file-access-from-files'],
});

async function open(job) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`  page error (${path.basename(job.out)}): ${e.message}`));
  const w = job.props?.width ?? 1080;
  const h = job.props?.height ?? 1920;
  await page.setViewport({width: w, height: h, deviceScaleFactor: 1});
  if (job.props) await page.evaluateOnNewDocument((p) => { window.__props = p; }, job.props);
  const url = job.url ? pathToFileURL(path.resolve(job.url)).href : pathToFileURL(path.join(root, 'index.html')).href;
  await page.goto(url, {waitUntil: 'load'});
  await page.waitForFunction('typeof window.__seek === "function"', {timeout: 60000});
  // our scenes set __ready after fonts/images; external pages may not — give them a moment
  await page.waitForFunction('window.__ready === true', {timeout: job.url ? 3000 : 60000}).catch(() => undefined);
  const meta = await page.evaluate(() => window.__videoMeta || null);
  if (meta && (meta.width !== w || meta.height !== h)) await page.setViewport({width: meta.width, height: meta.height, deviceScaleFactor: 1});
  return {page, meta: meta || {width: w, height: h, duration: job.duration ?? 3, fps: job.props?.fps ?? 30}};
}

async function renderJob(job) {
  const t0 = Date.now();
  fs.mkdirSync(path.dirname(job.out), {recursive: true});
  const {page, meta} = await open(job);
  const fps = meta.fps || 30;
  try {
    if (job.kind === 'still') {
      await page.evaluate((t) => window.__seek(t), (job.frame ?? 0) / fps);
      const jpeg = job.out.endsWith('.jpg');
      await page.screenshot({path: job.out, type: jpeg ? 'jpeg' : 'png', ...(jpeg ? {quality: 92} : {omitBackground: true})});
    } else {
      const duration = job.duration ?? meta.duration;
      const n = Math.max(1, Math.round(duration * fps));
      const ff = spawn(ffmpegBin, ['-hide_banner', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', job.out], {stdio: ['pipe', 'inherit', 'inherit']});
      const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
      for (let i = 0; i < n; i++) {
        await page.evaluate((t) => window.__seek(t), i / fps);
        const buf = await page.screenshot({type: 'png', omitBackground: true});
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      await done;
    }
    console.log(`ok   ${path.relative(process.cwd(), job.out)}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } finally {
    await page.close();
  }
}

let failed = 0;
const queue = [...jobs];
const t0 = Date.now();
await Promise.all(
  Array.from({length: Math.min(workers, queue.length)}, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        await renderJob(job);
      } catch (e) {
        failed++;
        console.error(`FAIL ${job.out}: ${e?.message ?? e}`);
      }
    }
  }),
);
await browser.close();
console.log(`${jobs.length - failed}/${jobs.length} rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(failed ? 1 : 0);
