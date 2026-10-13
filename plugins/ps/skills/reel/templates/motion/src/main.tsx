// Entry: renders one Beat or Cover on a Stage from window.__props (set by render.mjs).
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Stage} from './animations';
import {Beat} from './Beat';
import {Cover} from './Cover';
import {loadFonts} from './fonts';
import {defaultBeat} from './schema';

const props = window.__props ?? {...defaultBeat, composition: 'Beat'};
const isCover = props.composition === 'Cover';
const width = props.width ?? 1080;
const height = props.height ?? 1920;
const duration = isCover ? 1 : props.duration ?? 3;
const fps = props.fps ?? 30;

loadFonts().then(() => {
  createRoot(document.getElementById('root')!).render(
    <Stage width={width} height={height} duration={duration} fps={fps}>
      {isCover ? <Cover {...props} /> : <Beat {...props} />}
    </Stage>,
  );
  // ready once fonts are in and every <img> has decoded
  const wait = () =>
    Promise.all(Array.from(document.images).map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => undefined))));
  requestAnimationFrame(() => requestAnimationFrame(() => wait().then(() => (window.__ready = true))));
});
