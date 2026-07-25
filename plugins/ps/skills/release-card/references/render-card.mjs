#!/usr/bin/env node
// Render a branded release-notes card (PNG) from grouped commit messages.
// Engine: satori (HTML/CSS -> SVG) + @resvg/resvg-js (SVG -> PNG) — the same
// renderer that lives inside @vercel/og, but standalone in plain Node.
//
// Usage:
//   node render-card.mjs --data notes.json --theme fonoster-green \
//        --logo "Routr" --lang en --out release-v2.12.0.png [--max 16]
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
//
// Section item `message` text is NOT translated by this script — the caller
// (the skill) is responsible for writing notes.json in the target language
// when --lang isn't English; this script only translates its own UI chrome
// (kicker, section headings, footer stats) via the I18N table below.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 portrait — the strongest social-feed aspect ratio.

// ─────────────────────────────────────────────────────────────────────────────
// BRAND THEMES. `fonoster-*` use the official Fonoster palette (Primary/
// Secondary/Tertiary) — accent used sparingly (top band, logo mark, tag pill),
// everything else neutral Base grays via DEFAULT_PALETTE below. A theme may
// also fully re-skin the card (palette, fonts, lettermark logo) — see
// `micobro` for a from-scratch brand rather than an accent swap.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PALETTE = {
  ink: '#252525',        // Base-08 — titles & section headings
  body: '#333333',       // Base-07 — commit messages
  muted: '#8D8D8D',      // Base-05 — kicker, date, footer stats
  hair: '#E8E8E8',       // Base-03 — hairline dividers
  bullet: '#C2C2C2',     // Base-04 — commit bullets
  chipBg: '#F4F4F4',     // Base-02
  chipText: '#555555',   // Base-06
  chipBorder: '#E8E8E8', // Base-03
};

const THEMES = {
  'fonoster-green':  { accent: '#39E19E', pillBg: '#E6FFF5', pillText: '#053204', pillBorder: '#CCEFE1' },
  'fonoster-blue':   { accent: '#5FCFCE', pillBg: '#F0FDFF', pillText: '#0D3231', pillBorder: '#CDE3E8' },
  'fonoster-orange': { accent: '#FF9965', pillBg: '#FFF4F0', pillText: '#27150C', pillBorder: '#F1DED7' },
  // micobro.app brand — tokens lifted from site/src/index.css (@theme) and
  // site/src/components/Logo.tsx: deep-teal lettermark badge, Sora wordmark,
  // Plus Jakarta Sans body, teal accent (brand-blue-primary).
  'micobro': {
    accent: '#0e7c6b',       // --color-brand-blue-primary
    pillBg: '#e8f7f2',       // --color-brand-mist
    pillText: '#0b4f4a',     // --color-brand-blue-deep
    pillBorder: '#cfe8e0',
    ink: '#142a26',          // --color-brand-ink
    body: '#2c4a43',
    muted: '#697a93',        // --color-ds-muted
    hair: '#e5eaf1',         // --color-ds-border
    bullet: '#9fc9bd',
    chipBg: '#eef6f3',
    chipText: '#0b4f4a',
    chipBorder: '#d6ece5',
    bodyFont: 'Plus Jakarta Sans',
    wordmarkFont: 'Sora',
    wordmarkWeight: 700,
    wordmarkColor: '#0b4f4a',
    logo: { glyph: 'm', glyphColor: '#FFFFFF', bg: '#0b4f4a', size: 46, radiusRatio: 0.28 },
  },
};

// Maps a font family name to its @fontsource package slug.
const FONT_PKG = {
  'Inter': 'inter',
  'Poppins': 'poppins',
  'JetBrains Mono': 'jetbrains-mono',
  'Plus Jakarta Sans': 'plus-jakarta-sans',
  'Sora': 'sora',
};

// ─────────────────────────────────────────────────────────────────────────────
// I18N — UI chrome strings + conventional-commit section headings, per
// --lang. `en` is the default and matches the card's original copy exactly.
// Add a language by adding a key here; commit `message` text itself is
// supplied already-translated by the caller (see file header).
// ─────────────────────────────────────────────────────────────────────────────
const I18N = {
  en: {
    kicker: 'RELEASE',
    moreCommits: (n) => `+ ${n} more commits`,
    contributors: (n) => `${n} contributor${n === 1 ? '' : 's'}`,
    commits: (n) => `${n} commits`,
    sections: {
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
    },
  },
  es: {
    kicker: 'LANZAMIENTO',
    moreCommits: (n) => `+ ${n} commits más`,
    contributors: (n) => `${n} ${n === 1 ? 'colaborador' : 'colaboradores'}`,
    commits: (n) => `${n} commits`,
    sections: {
      feat:     { emoji: '🎉', label: 'Nuevas Funciones', order: 1 },
      fix:      { emoji: '🐛', label: 'Correcciones de Errores', order: 2 },
      perf:     { emoji: '⚡', label: 'Rendimiento', order: 3 },
      refactor: { emoji: '🔧', label: 'Refactorizaciones', order: 4 },
      docs:     { emoji: '📚', label: 'Documentación', order: 5 },
      build:    { emoji: '🏗️', label: 'Compilación', order: 6 },
      ci:       { emoji: '🤖', label: 'Integración Continua', order: 7 },
      test:     { emoji: '✅', label: 'Pruebas', order: 8 },
      chore:    { emoji: '🧹', label: 'Mantenimiento', order: 9 },
      style:    { emoji: '💅', label: 'Estilos', order: 10 },
    },
  },
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
// primary body font (regular weight) when offline.
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

async function loadFont(family, weight, { isPrimaryBodyRegular = false } = {}) {
  if (isPrimaryBodyRegular && weight === 400 && process.env.FONT_PATH) {
    return fs.readFileSync(process.env.FONT_PATH);
  }
  const pkg = FONT_PKG[family];
  if (!pkg) throw new Error(`No @fontsource package mapping for font "${family}" — add one to FONT_PKG.`);
  const file = `${pkg}-latin-${weight}-normal.woff`;
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@4.5.15/files/${file}`,
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@4.5/files/${file}`,
    `https://cdn.jsdelivr.net/npm/@fontsource/${pkg}@5.0.0/files/${file}`,
    `https://unpkg.com/@fontsource/${pkg}@4.5.15/files/${file}`,
    `https://unpkg.com/@fontsource/${pkg}/files/${file}`,
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

// Filled in once per render by buildTree() from the resolved theme palette.
let INK, BODY, MUTED, HAIR, BULLET, CHIP_BG, CHIP_TEXT, CHIP_BORDER;

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

function sectionBlock(sec, i18n) {
  const meta = i18n.sections[sec.type] || { emoji: '•', label: sec.type };
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

// Header/footer wordmark. Plain colored square by default (theme.logo unset);
// a lettermark badge (e.g. micobro's "m") when the theme defines one.
function logoMark(theme) {
  if (!theme.logo) {
    return h('div', { display: 'flex', width: 30, height: 30, borderRadius: 8, backgroundColor: theme.accent, marginRight: 16 }, []);
  }
  const { glyph, glyphColor, bg, size = 46, radiusRatio = 0.28 } = theme.logo;
  return h('div', {
    display: 'flex', width: size, height: size, borderRadius: Math.round(size * radiusRatio),
    backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginRight: 16,
  }, [
    h('div', { display: 'flex', fontFamily: theme.wordmarkFont || 'Poppins', fontSize: Math.round(size * 0.56), fontWeight: theme.wordmarkWeight || 600, color: glyphColor }, glyph),
  ]);
}

function buildTree(data, theme, logo, maxItems, i18n) {
  const { accent } = theme;
  const palette = { ...DEFAULT_PALETTE, ...theme };
  INK = palette.ink; BODY = palette.body; MUTED = palette.muted; HAIR = palette.hair;
  BULLET = palette.bullet; CHIP_BG = palette.chipBg; CHIP_TEXT = palette.chipText; CHIP_BORDER = palette.chipBorder;

  const wordmarkFont = theme.wordmarkFont || 'Poppins';
  const wordmarkWeight = theme.wordmarkWeight || 600;
  const wordmarkColor = theme.wordmarkColor || INK;

  // Order sections, then trim to a line budget so long releases don't overflow.
  const ordered = (data.sections || [])
    .filter((s) => s.items && s.items.length)
    .sort((a, b) => (i18n.sections[a.type]?.order ?? 99) - (i18n.sections[b.type]?.order ?? 99));

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
      logoMark(theme),
      h('div', { display: 'flex', fontFamily: wordmarkFont, fontSize: 38, fontWeight: wordmarkWeight, color: wordmarkColor }, logo),
    ]),
    h('div', {
      display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 26, color: theme.pillText, fontWeight: 700,
      backgroundColor: theme.pillBg, border: `1px solid ${theme.pillBorder}`, borderRadius: 999, padding: '6px 20px',
    }, data.tag),
  ]);

  const title = h('div', { display: 'flex', flexDirection: 'column', marginTop: 40 }, [
    h('div', { display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 4, color: MUTED }, i18n.kicker),
    h('div', { display: 'flex', fontSize: 84, fontWeight: 800, color: INK, marginTop: 4, lineHeight: 1 }, data.tag),
    h('div', { display: 'flex', fontSize: 28, color: MUTED, marginTop: 12 }, data.date || ''),
  ]);

  const sections = trimmed.map((s) => sectionBlock(s, i18n));

  const moreLine = dropped > 0
    ? h('div', { display: 'flex', color: MUTED, fontSize: 26, marginTop: 22 }, i18n.moreCommits(dropped))
    : null;

  const footerStats = [data.repo, data.contributors != null ? i18n.contributors(data.contributors) : null,
    data.commits != null ? i18n.commits(data.commits) : null].filter(Boolean).join('  ·  ');
  const footer = h('div', {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
    marginTop: 'auto', paddingTop: 28, borderTop: `1px solid ${HAIR}`, color: MUTED, fontSize: 26,
  }, [
    h('div', { display: 'flex' }, footerStats),
    h('div', { display: 'flex', fontFamily: wordmarkFont, fontWeight: wordmarkWeight, color: INK }, logo),
  ]);

  const body = [header, title, ...sections];
  if (moreLine) body.push(moreLine);
  body.push(footer);

  return h('div', {
    display: 'flex', flexDirection: 'column', position: 'relative',
    width: WIDTH, height: HEIGHT, backgroundColor: '#FFFFFF',
    padding: '72px 72px 56px', fontFamily: theme.bodyFont || 'Inter',
  }, [brandBand, ...body]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const theme = THEMES[args.theme || 'fonoster-green'];
  if (!theme) {
    console.error(`Unknown --theme "${args.theme}". Options: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }
  const lang = args.lang || 'en';
  const i18n = I18N[lang];
  if (!i18n) {
    console.error(`Unknown --lang "${lang}". Options: ${Object.keys(I18N).join(', ')}`);
    process.exit(1);
  }
  if (!args.data || !args.out) {
    console.error('Required: --data <json> and --out <png>.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(args.data, 'utf8'));
  const logo = args.logo || data.logo || data.repo?.split('/').pop() || 'Release';
  const maxItems = Number(args.max) || 16;

  const bodyFont = theme.bodyFont || 'Inter';
  const wordmarkFont = theme.wordmarkFont || 'Poppins';
  const wordmarkWeight = theme.wordmarkWeight || 600;

  const [bodyRegular, bodyBold, bodyExtraBold, mono400, wordmarkFontData] = await Promise.all([
    loadFont(bodyFont, 400, { isPrimaryBodyRegular: true }),
    loadFont(bodyFont, 700),
    loadFont(bodyFont, 800),
    loadFont('JetBrains Mono', 400),
    loadFont(wordmarkFont, wordmarkWeight),
  ]);
  const fonts = [
    { name: bodyFont, data: bodyRegular, weight: 400, style: 'normal' },
    { name: bodyFont, data: bodyBold, weight: 700, style: 'normal' },
    { name: bodyFont, data: bodyExtraBold, weight: 800, style: 'normal' },
    { name: 'JetBrains Mono', data: mono400, weight: 400, style: 'normal' },
    { name: wordmarkFont, data: wordmarkFontData, weight: wordmarkWeight, style: 'normal' },
  ];

  const svg = await satori(buildTree(data, theme, logo, maxItems, i18n), {
    width: WIDTH, height: HEIGHT, fonts,
    loadAdditionalAsset: async (code, segment) => (code === 'emoji' ? loadEmoji(segment) : code),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  fs.writeFileSync(args.out, png);
  console.log(args.out);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
