// Motion vocabulary shared by every scene. Keep scenes on these presets so a
// reel feels like one system: same springs, same entrances, same exits.
import {CSSProperties} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from './animations';

export const SPRINGS = {
  // UI elements landing: quick, tiny overshoot
  snappy: {damping: 16, stiffness: 170, mass: 0.7},
  // big type and emphasis: visible bounce
  pop: {damping: 11, stiffness: 190, mass: 0.6},
  // panels, camera, backgrounds: no overshoot
  smooth: {damping: 22, stiffness: 120, mass: 1}, // critically damped
} as const;

export type SpringName = keyof typeof SPRINGS;

/** 0→1 spring that starts `at` seconds into the scene. */
export const useSpringAt = (at: number, name: SpringName = 'snappy'): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at * fps), fps, config: SPRINGS[name]});
};

/** Seconds since the scene started. */
export const useTime = (): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

/** 1 while on screen, eases to 0 over the last `seconds` of the scene. */
export const useExit = (seconds = 0.35, enabled = true): number => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  if (!enabled) return 1;
  const n = Math.max(1, Math.round(seconds * fps));
  return interpolate(frame, [durationInFrames - n, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
};

/** Blur-up entrance: the house style for anything that appears. */
export const enter = (p: number, distance = 36, blur = 10): CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateY(${(1 - p) * distance}px) scale(${0.96 + 0.04 * p})`,
  filter: p < 0.999 ? `blur(${(1 - Math.min(p, 1)) * blur}px)` : undefined,
});

/** Same entrance but sideways (rows, chips, bubbles). */
export const enterX = (p: number, distance = 48, blur = 8): CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateX(${(1 - p) * distance}px)`,
  filter: p < 0.999 ? `blur(${(1 - Math.min(p, 1)) * blur}px)` : undefined,
});

/** Linear 0→1 between two times (seconds), eased. */
export const between = (t: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)): number =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Default stagger: when an item has no explicit time, space them out after a lead-in. */
export const staggerAt = (i: number, explicit: number | undefined, lead = 0.25, step = 0.32): number =>
  explicit ?? lead + i * step;

/** Split "*emphasized* words" into tokens with an emphasis flag. */
export const tokenize = (text: string): {t: string; emph: boolean}[] => {
  const out: {t: string; emph: boolean}[] = [];
  let on = false;
  for (const raw of (text ?? '').split(/\s+/).filter(Boolean)) {
    if (raw.startsWith('*')) on = true;
    const t = raw.replace(/\*/g, '');
    if (t) out.push({t, emph: on});
    if (/\*[,.:;!?…]*$/.test(raw)) on = false;
  }
  return out;
};

/** Split text into runs for inline emphasis: "*Q*Cobro" → [{t:"Q",emph:true},{t:"Cobro",emph:false}]. */
export const segments = (text: string): {t: string; emph: boolean}[] =>
  (text ?? '').split('*').map((t, i) => ({t, emph: i % 2 === 1})).filter((x) => x.t.length > 0);

/** Deterministic pseudo-random in [0,1) — never Math.random() in a render. */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- choreography
// GSAP-style eases, so scenes can be timed like a hand-built timeline.
export const EASE = {
  linear: (x: number) => x,
  p2out: Easing.out(Easing.cubic), // power2.out
  p3out: Easing.out(Easing.poly(4)), // power3.out
  p2in: Easing.in(Easing.cubic), // power2.in
  p2inout: Easing.inOut(Easing.cubic),
  back: (s = 1.7) => Easing.out(Easing.back(s)), // back.out(s)
};

/** 0→1 over [at, at+dur] with an ease; 0 before, 1 after. */
export const ramp = (t: number, at: number, dur: number, ease: (x: number) => number = EASE.p3out): number =>
  dur <= 0 ? (t >= at ? 1 : 0) : ease(Math.min(1, Math.max(0, (t - at) / dur)));

/** Up-then-down pulse (yoyo) — e.g. a ring that flashes on a spoken word. */
export const pulse = (t: number, at: number, dur = 0.3, repeats = 1): number => {
  const total = dur * 2 * repeats;
  if (t < at || t > at + total) return 0;
  const ph = ((t - at) % (dur * 2)) / dur;
  return ph <= 1 ? EASE.p2out(ph) : EASE.p2out(2 - ph);
};

/** A short horizontal shake (error / state flip). Returns px offset. */
export const shake = (t: number, at: number): number => {
  const k = [0, -10, 10, -6, 0];
  const ts = [0, 0.05, 0.12, 0.18, 0.23];
  if (t < at || t > at + 0.23) return 0;
  const x = t - at;
  for (let i = 0; i < ts.length - 1; i++) {
    if (x <= ts[i + 1]) return k[i] + ((k[i + 1] - k[i]) * (x - ts[i])) / (ts[i + 1] - ts[i]);
  }
  return 0;
};

/**
 * Named moments inside a beat, in seconds from the beat's start. mg_render.py resolves
 * them from reel.json — usually anchored to spoken words — so a stamp lands on
 * "evidencia" and a status flips on "no se entregó".
 */
export const cue = (cues: Record<string, number> | undefined, name: string, fallback: number): number =>
  cues && typeof cues[name] === 'number' ? cues[name] : fallback;

/** Scene in/out used between back-to-back beats (fade + slight scale + rise). */
export const sceneIO = (t: number, duration: number, enter = true, exit = true): CSSProperties => {
  const i = enter ? ramp(t, 0, 0.35, EASE.p3out) : 1;
  const o = exit ? ramp(t, duration - 0.25, 0.25, EASE.p2in) : 0;
  return {
    opacity: i * (1 - o),
    transform: `translateY(${(1 - i) * 20 - o * 20}px) scale(${0.96 + 0.04 * i + 0.03 * o})`,
  };
};
