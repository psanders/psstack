// Brand tokens. A reel picks a preset by name in reel.json ("brand": "qcobro")
// or passes an object that overrides any token ({"preset": "qcobro", "accent": "#22c55e"}).
// The base look (dark cards on a dotted radial background) is the one from the
// original hand-built QCobro reel.

export type Brand = {
  bg: string; // page background (panel/full layouts)
  bgGlow: string; // center of the radial background
  surface: string; // cards
  surface2: string; // rows, tiles and chips inside cards
  border: string; // card and row borders
  text: string;
  muted: string;
  accent: string; // main highlight (checks, progress, "ok", emphasis)
  accent2: string; // second actor (AI turns)
  danger: string;
  warn: string;
  info: string;
  // message bubbles
  humanBg: string;
  aiBg: string;
  aiBorder: string;
  aiText: string;
  okBg: string; // a sent/approved message
  okBorder: string;
  okText: string;
  onAccent: string; // icon/text color on an accent fill
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  radius: number;
};

const base: Brand = {
  bg: '#0e1014',
  bgGlow: '#161a22',
  surface: '#171a21',
  surface2: '#1d212a',
  border: '#2b303b',
  text: '#f4f5f7',
  muted: '#9aa3b2',
  accent: '#60a5fa',
  accent2: '#a78bfa',
  danger: '#f87171',
  warn: '#fbbf24',
  info: '#93c5fd',
  humanBg: '#232834',
  aiBg: '#241f3a',
  aiBorder: '#3d3470',
  aiText: '#e3dcff',
  okBg: '#132a3d',
  okBorder: '#1f4a6b',
  okText: '#cfe6ff',
  onAccent: '#06182a',
  fontDisplay: 'Inter',
  fontBody: 'Inter',
  fontMono: 'JetBrains Mono',
  radius: 30,
};

export const PRESETS: Record<string, Brand> = {
  neutral: base,
  qcobro: {...base, accent: '#34d399', okBg: '#133329', okBorder: '#1f5a45', okText: '#bff3dc', onAccent: '#06281c'},
  fonoster: {...base, accent: '#20c997', okBg: '#12302a', okBorder: '#1d5a4c', okText: '#c3f2e4', onAccent: '#05261f'},
  micobro: {...base, accent: '#14b8a6', accent2: '#f59e0b', okBg: '#112f2c', okBorder: '#1b5751', okText: '#c0efe9', onAccent: '#042522'},
};

export const resolveBrand = (b: unknown): Brand => {
  if (typeof b === 'string') return PRESETS[b] ?? base;
  if (b && typeof b === 'object') {
    const o = b as Partial<Brand> & {preset?: string};
    return {...(PRESETS[o.preset ?? 'neutral'] ?? base), ...o};
  }
  return base;
};

// hex -> rgba() with alpha, for glows and tints
export const alpha = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
