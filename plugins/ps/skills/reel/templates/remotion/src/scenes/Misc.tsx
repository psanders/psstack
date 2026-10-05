// Smaller scenes: channel chips, lower third, call to action.
import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, Brand} from '../brand';
import {between, enter, enterX, staggerAt, useSpringAt, useTime} from '../motion';
import {Icon, RichText} from '../ui';

// props: {title?, items: [{icon, label, at?}], highlight?: index, columns?: number}
export const Channels: React.FC<{brand: Brand; p: Record<string, any>; boxWidth: number}> = ({brand, p, boxWidth}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useTime();
  const items: any[] = p.items ?? [];
  const cols = p.columns ?? (items.length <= 3 ? items.length : 2);
  const gap = 26;
  const w = (boxWidth - gap * (cols - 1)) / cols;
  const head = useSpringAt(0);
  return (
    <div style={{width: boxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36}}>
      {p.title ? (
        <div style={{...enter(head), fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 66, color: brand.text, textAlign: 'center', lineHeight: 1.1}}>
          <RichText brand={brand} text={p.title} sweep={between(t, 0.3, 0.8)} />
        </div>
      ) : null}
      <div style={{display: 'flex', flexWrap: 'wrap', gap, justifyContent: 'center', width: boxWidth}}>
        {items.map((it, i) => {
          const at = staggerAt(i, it.at, 0.25, 0.22);
          const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 12, stiffness: 190, mass: 0.6}});
          const hl = p.highlight === i;
          const c = hl ? brand.accent : brand.text;
          return (
            <div key={i} style={{width: w, display: 'flex', alignItems: 'center', gap: 20, padding: '26px 30px', borderRadius: 28, background: hl ? alpha(brand.accent, 0.14) : brand.surface, border: `2px solid ${hl ? alpha(brand.accent, 0.7) : brand.border}`, boxShadow: hl ? `0 0 40px ${alpha(brand.accent, 0.35)}` : '0 20px 50px rgba(0,0,0,0.35)', transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 1.5)}}>
              <Icon name={it.icon ?? 'chat'} size={46} color={hl ? brand.accent : brand.muted} />
              <span style={{fontFamily: brand.fontBody, fontWeight: 700, fontSize: 40, color: c}}>{it.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// props: {name, role?}
export const LowerThird: React.FC<{brand: Brand; p: Record<string, any>}> = ({brand, p}) => {
  const bar = useSpringAt(0.05, 'smooth');
  const name = useSpringAt(0.2);
  const role = useSpringAt(0.32);
  return (
    <div style={{alignSelf: 'flex-start', display: 'flex', alignItems: 'stretch', gap: 22}}>
      <div style={{width: 10, borderRadius: 5, background: brand.accent, transform: `scaleY(${bar})`, transformOrigin: 'top', boxShadow: `0 0 20px ${alpha(brand.accent, 0.6)}`}} />
      <div style={{padding: '18px 34px', borderRadius: 24, background: alpha(brand.bg, 0.86), border: `1.5px solid ${brand.border}`}}>
        <div style={{...enterX(name, -30), fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 56, color: brand.text}}>{p.name}</div>
        {p.role ? <div style={{...enterX(role, -30), fontFamily: brand.fontBody, fontWeight: 600, fontSize: 34, color: brand.accent, marginTop: 4}}>{p.role}</div> : null}
      </div>
    </div>
  );
};

// props: {title, subtitle?, button?, url?}
export const Cta: React.FC<{brand: Brand; p: Record<string, any>; boxWidth: number}> = ({brand, p, boxWidth}) => {
  const t = useTime();
  const h = useSpringAt(0.1, 'pop');
  const b = useSpringAt(0.45, 'pop');
  const u = useSpringAt(0.6);
  const shimmer = ((t * 0.6) % 1.4) - 0.2;
  return (
    <div style={{width: boxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, textAlign: 'center'}}>
      <div style={{...enter(h, 50, 14), fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 104, lineHeight: 1.05, letterSpacing: -2, color: brand.text}}>
        <RichText brand={brand} text={p.title ?? ''} sweep={between(t, 0.4, 0.9)} />
      </div>
      {p.subtitle ? <div style={{...enter(u), fontFamily: brand.fontBody, fontWeight: 500, fontSize: 44, color: brand.muted}}>{p.subtitle}</div> : null}
      {p.button ? (
        <div style={{position: 'relative', overflow: 'hidden', padding: '30px 64px', borderRadius: 999, background: brand.accent, color: '#06110d', fontFamily: brand.fontBody, fontWeight: 800, fontSize: 46, transform: `scale(${0.6 + 0.4 * b})`, opacity: Math.min(1, b * 1.5), boxShadow: `0 0 60px ${alpha(brand.accent, 0.5)}`}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, width: '30%', left: `${shimmer * 100}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', transform: 'skewX(-20deg)'}} />
          <span style={{position: 'relative'}}>{p.button}</span>
        </div>
      ) : null}
      {p.url ? <div style={{...enter(u), fontFamily: brand.fontMono, fontWeight: 600, fontSize: 40, color: brand.accent}}>{p.url}</div> : null}
    </div>
  );
};
