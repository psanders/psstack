#!/usr/bin/env node
// Render a branded release-notes card (PNG) from grouped commit messages.
// Engine: satori (HTML/CSS -> SVG) + @resvg/resvg-js (SVG -> PNG) — the same
// renderer that lives inside @vercel/og, but standalone in plain Node.
//
// Usage:
//   node render-card.mjs --data notes.json --theme fonoster-green \
//        --logo "Routr" --out release-v2.12.0.png [--max 16]
//
// notes.json shape:
//   {
//     "repo": "fonoster/routr",
//     "tag": "v2.12.0",
//     "date": "2024-06-25",
//     "contributors": 6,
//     "commits": 31,
//     "sections": [
//       { "type": "feat", "items": [ { "message": "Implement X", "sha": "96ef709" } ] },
//       { "type": "fix",  "items": [ { "message": "Allow Y",      "sha": "063fc8e" } ] }
//     ]
//   }

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 portrait — the strongest social-feed aspect ratio.

// ─────────────────────────────────────────────────────────────────────────────
// BRAND THEMES — the official Fonoster palette (Primary/Secondary/Tertiary).
// Accent is used sparingly: the top band, the logo mark, and the tag pill.
// `prime` would fail WCAG AA as text on white, so the pill uses `dark` text on
// a `light` tint. Everything else is neutral Base grays (see below).
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  'fonoster-green':  { accent: '#39E19E', pillBg: '#E6FFF5', pillText: '#053204', pillBorder: '#CCEFE1' },
  'fonoster-blue':   { accent: '#5FCFCE', pillBg: '#F0FDFF', pillText: '#0D3231', pillBorder: '#CDE3E8' },
  'fonoster-orange': { accent: '#FF9965', pillBg: '#FFF4F0', pillText: '#27150C', pillBorder: '#F1DED7' },
};

// Neutral Base palette — carries the list so the accent doesn't overwhelm.
const INK = '#252525';    // Base-08 — titles & section headings
const BODY = '#333333';   // Base-07 — commit messages
const MUTED = '#8D8D8D';  // Base-05 — kicker, date, footer stats
const HAIR = '#E8E8E8';   // Base-03 — hairline dividers
const BULLET = '#C2C2C2'; // Base-04 — commit bullets
const CHIP_BG = '#F4F4F4'; // Base-02
const CHIP_TEXT = '#555555'; // Base-06
const CHIP_BORDER = '#E8E8E8'; // Base-03

// Conventional-commit type → section heading. Order defines section order.
const SECTIONS = {
  feat:     { emoji: '🎉', label: 'New Features', order: 1 },
  fix:      { emoji: '🐛', label: 'Bug Fixes', order: 2 },
  perf:     { emoji: '⚡', label: 'Performance', order: 3 },
  refactor: { emoji: '🔧', label: 'Refactors', order: 4 },
  docs:     { emoji: '📚', label: 'Documentation', order: 5 },
  build:    { emoji: '🏗️', label: 'Build System', order: 6 },
  ci:       { emoji: '🤖', label: 'CI', order: 7 },
  test:     { emoji: '✅', label: 'Tests', order: 8 },
  chore:    { emoji: '🧹', label: 'Chores', order: 9 },
  style:    { emoji: '💅', label: 'Styles', order: 10 },
};

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    out[k.slice(2)] = argv[i + 1];
  }
  return out;
}

// satori vectorizes glyphs into the SVG, so resvg does NOT need the font.
// Try a couple of WOFF mirrors, cache locally. Override with FONT_PATH for the
// body font when offline.
async function fetchCached(url, cacheFile) {
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cacheFile, buf);
  return buf;
}

const CACHE = path.join(os.tmpdir(), 'ps-release-card');
fs.mkdirSync(CACHE, { recursive: true });

async function loadFont(family, pkg, weight) {
  if (family === 'Inter' && weight === 400 && process.env.FONT_PATH) {
    return fs.readFileSync(process.env.FONT_PATH);
  }
  const file = `${pkg}-latin-${weight}-normal.woff`;
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@4.5.15/files/${file}`,
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@4.5/files/${file}`,
    `https://unpkg.com/@fontsource/${pkg}@4.5.15/files/${file}`,
  ];
  let lastErr;
  for (const url of urls) {
    try { return await fetchCached(url, path.join(CACHE, file)); }
    catch (e) { lastErr = e; }
  }
  throw new Error(`Could not fetch font ${family} ${weight}. Last: ${lastErr}`);
}

// Twemoji loader for satori's loadAdditionalAsset. Degrades to no-image if the
// CDN is unreachable, so a missing emoji never fails the whole render.
async function loadEmoji(emoji) {
  const cp = [...emoji]
    .filter((c) => c !== '️')
    .map((c) => c.codePointAt(0).toString(16))
    .join('-');
  const cacheFile = path.join(CACHE, `emoji-${cp}.svg`);
  const urls = [
    `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${cp}.svg`,
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${cp}.svg`,
  ];
  for (const url of urls) {
    try {
      const buf = await fetchCached(url, cacheFile);
      return `data:image/svg+xml;base64,${buf.toString('base64')}`;
    } catch { /* try next */ }
  }
  return ''; // graceful fallback: no emoji image
}

const h = (type, style, children) => ({ type, props: { style, children } });

function shaChip(sha) {
  return h('div', {
    display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 22, color: CHIP_TEXT,
    backgroundColor: CHIP_BG, border: `1px solid ${CHIP_BORDER}`, borderRadius: 8,
    padding: '2px 10px', marginLeft: 12, lineHeight: 1.4,
  }, sha);
}

function commitRow(item) {
  // Strip backticks; inline-code styling is a future enhancement.
  const message = String(item.message || '').replace(/`/g, '');
  return h('div', {
    display: 'flex', alignItems: 'flex-start', marginTop: 14, width: '100%',
  }, [
    h('div', {
      display: 'flex', width: 8, height: 8, borderRadius: 8,
      backgroundColor: BULLET, marginTop: 14, marginRight: 16, flexShrink: 0,
    }, []),
    h('div', { display: 'flex', flex: 1, color: BODY, fontSize: 30, lineHeight: 1.35 }, message),
    item.sha ? shaChip(item.sha) : h('div', { display: 'flex' }, []),
  ]);
}

function sectionBlock(sec) {
  const meta = SECTIONS[sec.type] || { emoji: '•', label: sec.type };
  const heading = h('div', {
    display: 'flex', alignItems: 'center', marginBottom: 6, marginTop: 14,
  }, [
    h('div', { display: 'flex', fontSize: 34, marginRight: 14 }, meta.emoji),
    h('div', { display: 'flex', fontSize: 36, fontWeight: 700, color: INK }, meta.label),
  ]);
  const rule = h('div', { display: 'flex', width: '100%', height: 1, backgroundColor: HAIR }, []);
  return h('div', { display: 'flex', flexDirection: 'column', marginTop: 24 }, [
    heading, rule, ...sec.items.map((it) => commitRow(it)),
  ]);
}

function buildTree(data, theme, logo, maxItems) {
  const { accent } = theme;
  // Order sections, then trim to a line budget so long releases don't overflow.
  const ordered = (data.sections || [])
    .filter((s) => s.items && s.items.length)
    .sort((a, b) => (SECTIONS[a.type]?.order ?? 99) - (SECTIONS[b.type]?.order ?? 99));

  let budget = maxItems;
  let dropped = 0;
  const trimmed = [];
  for (const sec of ordered) {
    if (budget <= 0) { dropped += sec.items.length; continue; }
    const items = sec.items.slice(0, budget);
    dropped += sec.items.length - items.length;
    budget -= items.length;
    trimmed.push({ ...sec, items });
  }

  const brandBand = h('div', {
    display: 'flex', width: WIDTH, height: 14, backgroundColor: accent,
    position: 'absolute', top: 0, left: 0,
  }, []);

  const header = h('div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  }, [
    h('div', { display: 'flex', alignItems: 'center' }, [
      h('div', { display: 'flex', width: 30, height: 30, borderRadius: 8, backgroundColor: accent, marginRight: 16 }, []),
      h('div', { display: 'flex', fontFamily: 'Poppins', fontSize: 38, fontWeight: 600, color: INK }, logo),
    ]),
    h('div', {
      display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 26, color: theme.pillText, fontWeight: 700,
      backgroundColor: theme.pillBg, border: `1px solid ${theme.pillBorder}`, borderRadius: 999, padding: '6px 20px',
    }, data.tag),
  ]);

  const title = h('div', { display: 'flex', flexDirection: 'column', marginTop: 40 }, [
    h('div', { display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 4, color: MUTED }, 'RELEASE'),
    h('div', { display: 'flex', fontSize: 84, fontWeight: 800, color: INK, marginTop: 4, lineHeight: 1 }, data.tag),
    h('div', { display: 'flex', fontSize: 28, color: MUTED, marginTop: 12 }, data.date || ''),
  ]);

  const sections = trimmed.map((s) => sectionBlock(s));

  const moreLine = dropped > 0
    ? h('div', { display: 'flex', color: MUTED, fontSize: 26, marginTop: 22 }, `+ ${dropped} more commits`)
    : null;

  const footerStats = [data.repo, data.contributors != null ? `${data.contributors} contributors` : null,
    data.commits != null ? `${data.commits} commits` : null].filter(Boolean).join('  ·  ');
  const footer = h('div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
    marginTop: 'auto', paddingTop: 28, borderTop: `1px solid ${HAIR}`, color: MUTED, fontSize: 26,
  }, [
    h('div', { display: 'flex' }, footerStats),
    h('div', { display: 'flex', fontFamily: 'Poppins', fontWeight: 600, color: INK }, logo),
  ]);

  const body = [header, title, ...sections];
  if (moreLine) body.push(moreLine);
  body.push(footer);

  return h('div', {
    display: 'flex', flexDirection: 'column', position: 'relative',
    width: WIDTH, height: HEIGHT, backgroundColor: '#FFFFFF',
    padding: '72px 72px 56px', fontFamily: 'Inter',
  }, [brandBand, ...body]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const theme = THEMES[args.theme || 'fonoster-green'];
  if (!theme) {
    console.error(`Unknown --theme "${args.theme}". Options: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }
  if (!args.data || !args.out) {
    console.error('Required: --data <json> and --out <png>.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(args.data, 'utf8'));
  const logo = args.logo || data.logo || data.repo?.split('/').pop() || 'Release';
  const maxItems = Number(args.max) || 16;

  // Poppins (brand primary typeface) is used for the wordmark only; body text
  // stays Inter, mono accents stay JetBrains Mono.
  const [inter400, inter700, inter800, mono400, poppins600] = await Promise.all([
    loadFont('Inter', 'inter', 400),
    loadFont('Inter', 'inter', 700),
    loadFont('Inter', 'inter', 800),
    loadFont('JetBrains Mono', 'jetbrains-mono', 400),
    loadFont('Poppins', 'poppins', 600),
  ]);
  const fonts = [
    { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
    { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
    { name: 'Inter', data: inter800, weight: 800, style: 'normal' },
    { name: 'JetBrains Mono', data: mono400, weight: 400, style: 'normal' },
    { name: 'Poppins', data: poppins600, weight: 600, style: 'normal' },
  ];

  const svg = await satori(buildTree(data, theme, logo, maxItems), {
    width: WIDTH, height: HEIGHT, fonts,
    loadAdditionalAsset: async (code, segment) => (code === 'emoji' ? loadEmoji(segment) : code),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  fs.writeFileSync(args.out, png);
  console.log(args.out);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
