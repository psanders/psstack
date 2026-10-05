// Claude Design–style animation runtime (Stage / Sprite / useTime), our own open
// implementation — no Remotion, no Anthropic code. A scene is plain React whose every
// visual derives from the playhead, so a headless browser can render it frame by frame:
//
//   window.__seek(t)      move the playhead to t seconds and wait for the DOM to settle
//   window.__videoMeta    {width, height, duration, fps}
//   window.__ready        true once fonts and images are loaded
//
// Rules for scenes (same as Claude Design's): all motion comes from useTime() — never CSS
// animations/transitions, Date.now(), timers or Math.random() (use rand(seed)).
import React, {createContext, CSSProperties, ReactNode, useContext, useLayoutEffect, useState} from 'react';
import {flushSync} from 'react-dom';

type StageInfo = {width: number; height: number; duration: number; fps: number; t: number};
const StageCtx = createContext<StageInfo>({width: 1080, height: 1920, duration: 1, fps: 30, t: 0});
const SpriteCtx = createContext<{start: number; end: number} | null>(null);

declare global {
  interface Window {
    __seek?: (t: number) => Promise<boolean>;
    __videoMeta?: {width: number; height: number; duration: number; fps: number};
    __ready?: boolean;
    __props?: any;
  }
}

/** The canvas: fixed size, owns the playhead. `transparent` keeps the page background clear (overlays). */
export const Stage: React.FC<{
  width: number;
  height: number;
  duration: number;
  fps?: number;
  background?: string;
  children: ReactNode;
}> = ({width, height, duration, fps = 30, background = 'transparent', children}) => {
  const [t, setT] = useState(0);
  useLayoutEffect(() => {
    window.__videoMeta = {width, height, duration, fps};
    window.__seek = (time: number) =>
      new Promise((resolve) => {
        flushSync(() => setT(Math.max(0, Math.min(time, duration))));
        requestAnimationFrame(() => resolve(true));
      });
  }, [width, height, duration, fps]);
  return (
    <StageCtx.Provider value={{width, height, duration, fps, t}}>
      <div style={{position: 'relative', width, height, overflow: 'hidden', background}}>{children}</div>
    </StageCtx.Provider>
  );
};

/** Shows its children only between `start` and `end` (seconds). */
export const Sprite: React.FC<{start?: number; end?: number; children: ReactNode}> = ({start = 0, end = Infinity, children}) => {
  const {t} = useContext(StageCtx);
  if (t < start || t >= end) return null;
  return <SpriteCtx.Provider value={{start, end}}>{children}</SpriteCtx.Provider>;
};

/** Playhead in seconds (stage time). */
export const useTime = (): number => useContext(StageCtx).t;

/** Time inside the nearest Sprite: {t, duration, progress}. */
export const useSprite = () => {
  const {t, duration} = useContext(StageCtx);
  const sp = useContext(SpriteCtx);
  const start = sp?.start ?? 0;
  const end = Number.isFinite(sp?.end ?? Infinity) ? (sp!.end as number) : duration;
  const local = t - start;
  return {t: local, duration: end - start, progress: Math.min(1, Math.max(0, local / Math.max(1e-6, end - start)))};
};

export const useStage = () => {
  const {width, height, duration, fps} = useContext(StageCtx);
  return {width, height, duration, fps};
};

// ---------------------------------------------------------------- helpers (frame-based API)
export const useCurrentFrame = (): number => {
  const {t, fps} = useContext(StageCtx);
  return Math.round(t * fps);
};

export const useVideoConfig = () => {
  const {width, height, duration, fps} = useContext(StageCtx);
  return {width, height, fps, durationInFrames: Math.max(1, Math.round(duration * fps))};
};

type Ease = (x: number) => number;
export const Easing = {
  linear: (x: number) => x,
  quad: (x: number) => x * x,
  cubic: (x: number) => x * x * x,
  poly: (n: number) => (x: number) => Math.pow(x, n),
  sin: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
  exp: (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * (x - 1))),
  circle: (x: number) => 1 - Math.sqrt(1 - x * x),
  back: (s = 1.70158) => (x: number) => x * x * ((s + 1) * x - s),
  in: (f: Ease) => f,
  out: (f: Ease) => (x: number) => 1 - f(1 - x),
  inOut: (f: Ease) => (x: number) => (x < 0.5 ? f(x * 2) / 2 : 1 - f((1 - x) * 2) / 2),
};

export const interpolate = (
  x: number,
  input: number[],
  output: number[],
  opts: {extrapolateLeft?: 'clamp' | 'extend'; extrapolateRight?: 'clamp' | 'extend'; easing?: Ease} = {},
): number => {
  let i = 1;
  while (i < input.length - 1 && x > input[i]) i++;
  const [a, b] = [input[i - 1], input[i]];
  const [c, d] = [output[i - 1], output[i]];
  let k = b === a ? 1 : (x - a) / (b - a);
  if (k < 0 && opts.extrapolateLeft === 'clamp') k = 0;
  if (k > 1 && opts.extrapolateRight === 'clamp') k = 1;
  if (opts.easing && k >= 0 && k <= 1) k = opts.easing(k);
  return c + (d - c) * k;
};

/** Damped spring 0→1, evaluated deterministically from frame 0 (same physics every render). */
export const spring = ({frame, fps, config = {}}: {frame: number; fps: number; config?: {damping?: number; stiffness?: number; mass?: number}}): number => {
  if (frame <= 0) return 0;
  const {damping = 10, stiffness = 100, mass = 1} = config;
  const steps = Math.ceil(frame * 4);
  const dt = frame / fps / steps;
  let x = 0;
  let v = 0;
  for (let i = 0; i < steps; i++) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
  }
  return x;
};

export const AbsoluteFill: React.FC<{style?: CSSProperties; children?: ReactNode}> = ({style, children}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', ...style}}>{children}</div>
);

/** Files under the project's public/ folder (fonts, cover images). */
export const staticFile = (p: string) => 'public/' + p.replace(/^\/+/, '');

export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => <img {...props} />;

// ---------------------------------------------------------------- svg paths
let measurer: SVGPathElement | null = null;
export const getLength = (d: string): number => {
  if (typeof document === 'undefined') return 1000;
  if (!measurer) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    measurer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(measurer);
    document.body.appendChild(svg);
  }
  measurer.setAttribute('d', d);
  return measurer.getTotalLength();
};

/** Draw a path progressively (0→1) with stroke dashes. */
export const evolvePath = (progress: number, d: string) => {
  const L = getLength(d);
  return {strokeDasharray: `${L} ${L}`, strokeDashoffset: L * (1 - progress)};
};
