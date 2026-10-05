// Big type that lands word by word, in sync with the speech.
// props: {text?: string, size?: number, align?: 'center'|'left'}
// tokens (from mg_render): [{t, emph, at}] — `at` = when the word is spoken.
import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, Brand} from '../brand';
import {SPRINGS, tokenize} from '../motion';
import {fitSize} from '../ui';
import type {TimedToken} from '../schema';

export const Kinetic: React.FC<{brand: Brand; p: Record<string, any>; tokens?: TimedToken[]; boxWidth: number}> = ({
  brand,
  p,
  tokens,
  boxWidth,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const toks: TimedToken[] = tokens?.length ? tokens : tokenize(p.text ?? '').map((x, i) => ({...x, at: 0.15 + i * 0.14}));
  const text = toks.map((x) => x.t).join(' ');
  const size = p.size ?? fitSize(text, 132, 64, boxWidth, 5, 0.6);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: p.align === 'left' ? 'flex-start' : 'center',
        alignContent: 'center',
        columnGap: size * 0.28,
        rowGap: size * 0.08,
        width: boxWidth,
        fontFamily: brand.fontDisplay,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -1,
        color: brand.text,
        textAlign: p.align === 'left' ? 'left' : 'center',
      }}
    >
      {toks.map((tk, i) => {
        const at = tk.at ?? 0.15 + i * 0.14;
        const s = spring({frame: frame - Math.round(at * fps), fps, config: tk.emph ? SPRINGS.pop : SPRINGS.snappy});
        const visible = s > 0.001;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: visible ? Math.min(1, s * 1.5) : 0,
              transform: `translateY(${(1 - s) * 0.45 * size}px) scale(${0.85 + 0.15 * s})`,
              filter: s < 0.999 ? `blur(${(1 - Math.min(s, 1)) * 12}px)` : undefined,
              color: tk.emph ? brand.accent : brand.text,
              textShadow: tk.emph ? `0 0 ${28 * s}px ${alpha(brand.accent, 0.55)}` : '0 6px 30px rgba(0,0,0,0.35)',
            }}
          >
            {tk.t}
          </span>
        );
      })}
    </div>
  );
};
