// Items that check off one by one (circle fills, tick draws itself).
// props: {title?, items: [{label, sub?, at?, state?: 'ok'|'fail'}]}
import {evolvePath} from '@remotion/paths';
import React from 'react';
import {alpha, Brand} from '../brand';
import {between, enter, enterX, staggerAt, useTime} from '../motion';
import {Card} from '../ui';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

const TICK = 'M 14 27 L 23 36 L 40 17';
const CROSS = 'M 17 17 L 37 37 M 37 17 L 17 37';

export const Checklist: React.FC<{brand: Brand; p: Record<string, any>; boxWidth: number}> = ({brand, p, boxWidth}) => {
  const t = useTime();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items: any[] = p.items ?? [];
  const head = spring({frame, fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
  return (
    <Card brand={brand} glow style={{width: boxWidth, padding: '46px 52px', ...enter(head, 40)}}>
      {p.title ? (
        <div style={{fontFamily: brand.fontBody, fontWeight: 700, fontSize: 34, letterSpacing: 2, textTransform: 'uppercase', color: brand.muted, marginBottom: 30}}>
          {p.title}
        </div>
      ) : null}
      <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
        {items.map((it, i) => {
          const at = staggerAt(i, it.at, 0.3, 0.45);
          const row = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 16, stiffness: 170, mass: 0.7}});
          const fill = between(t, at + 0.12, at + 0.32);
          const draw = between(t, at + 0.22, at + 0.5);
          const fail = it.state === 'fail';
          const color = fail ? brand.danger : brand.accent;
          const path = evolvePath(draw, fail ? CROSS : TICK);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, ...enterX(row, -40)}}>
              <svg width={64} height={64} viewBox="0 0 54 54" style={{flexShrink: 0}}>
                <circle cx={27} cy={27} r={24} fill={alpha(color, 0.12 + 0.88 * fill)} stroke={alpha(color, 0.6)} strokeWidth={2} />
                <path d={fail ? CROSS : TICK} fill="none" stroke={fill > 0.5 ? '#0b0d10' : color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={path.strokeDasharray} strokeDashoffset={path.strokeDashoffset} />
              </svg>
              <div>
                <div style={{fontFamily: brand.fontBody, fontWeight: 700, fontSize: 50, color: brand.text, lineHeight: 1.1}}>{it.label}</div>
                {it.sub ? <div style={{fontFamily: brand.fontBody, fontWeight: 500, fontSize: 32, color: brand.muted, marginTop: 6}}>{it.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
