// Bundle src/main.tsx (+ custom scenes) into dist/scene.js — runs in well under a second.
import {build} from 'esbuild';
await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/scene.js',
  jsx: 'automatic',
  target: 'chrome120',
  define: {'process.env.NODE_ENV': '"production"'},
  logLevel: 'error',
});
