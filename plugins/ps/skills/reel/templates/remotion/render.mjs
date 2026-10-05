// Batch renderer: bundles once, opens one browser, renders every job in jobs.json.
// Job: {composition: "Beat"|"Cover", props, out, kind: "video"|"still", frame?}
// Videos are ProRes 4444 with alpha (yuva444p10le) so assemble.py can lay them over the A-roll.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const root = path.dirname(fileURLToPath(import.meta.url));
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const chromeMode = process.env.REMOTION_CHROME_MODE || 'headless-shell';
const concurrency = Number(process.env.REEL_CONCURRENCY || 0) || null;
const licenseKey = process.env.REMOTION_LICENSE_KEY || null;

const t0 = Date.now();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {browserExecutable, chromeMode});
const common = {serveUrl, puppeteerInstance: browser, browserExecutable, chromeMode, logLevel: 'error'};
let failed = 0;
for (const job of jobs) {
  const t = Date.now();
  try {
    const composition = await selectComposition({...common, id: job.composition, inputProps: job.props});
    fs.mkdirSync(path.dirname(job.out), {recursive: true});
    if (job.kind === 'still') {
      const jpeg = job.out.endsWith('.jpg');
      await renderStill({...common, composition, inputProps: job.props, output: job.out, frame: job.frame ?? 0,
        imageFormat: jpeg ? 'jpeg' : 'png', ...(jpeg ? {jpegQuality: 92} : {}), overwrite: true, licenseKey});
    } else {
      await renderMedia({...common, composition, inputProps: job.props, outputLocation: job.out, codec: 'prores',
        proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png', colorSpace: 'bt709', concurrency, overwrite: true, licenseKey});
    }
    console.log(`ok   ${path.relative(process.cwd(), job.out)}  ${((Date.now() - t) / 1000).toFixed(1)}s`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${job.out}: ${e?.message ?? e}`);
  }
}
await browser.close({silent: true});
console.log(`${jobs.length - failed}/${jobs.length} rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(failed ? 1 : 0);
