// A number that counts up, with a progress ring that draws around it.
// props: {value: number, from?: number, prefix?, suffix?, decimals?, label, sublabel?, ring?: 0..1, at?}
import React from 'react';
import {Easing} from '../animations';
import {alpha, Brand} from '../brand';
import {between, enter, useSpringAt, useTime} from '../motion';

export const Stat: React.FC<{brand: Brand; p: Record<string, any>; boxWidth: number}> = ({brand, p, boxWidth}) => {
  const t = useTime();
  const at = p.at ?? 0.15;
  const appear = useSpringAt(at, 'pop');
  const lbl = useSpringAt(at + 0.35);
  const k = between(t, at + 0.1, at + 1.3, Easing.out(Easing.cubic));
  const from = Number(p.from ?? 0);
  const value = Number(p.value ?? 0);
  const dec = Number(p.decimals ?? (Number.isInteger(value) ? 0 : 1));
  const shown = (from + (value - from) * k).toLocaleString(p.locale ?? 'en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  const ring = p.ring === undefined ? null : Math.max(0, Math.min(1, Number(p.ring)));
  const R = Math.min(boxWidth * 0.36, 300);
  const C = 2 * Math.PI * R;
  const big = `${p.prefix ?? ''}${shown}${p.suffix ?? ''}`;
  const size = Math.min(210, (boxWidth * 1.45) / Math.max(3, big.length));
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, width: boxWidth}}>
      <div style={{position: 'relative', width: ring === null ? 'auto' : R * 2 + 40, height: ring === null ? 'auto' : R * 2 + 40, display: 'flex', alignItems: 'center', justifyContent: 'center', ...enter(appear, 30, 12)}}>
        {ring !== null ? (
          <svg width={R * 2 + 40} height={R * 2 + 40} style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={alpha('#ffffff', 0.08)} strokeWidth={22} />
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={brand.accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ring * k)} style={{filter: `drop-shadow(0 0 14px ${alpha(brand.accent, 0.6)})`}} />
          </svg>
        ) : null}
        <div style={{fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: size, letterSpacing: -3, color: brand.text, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 50px ${alpha(brand.accent, 0.35)}`}}>
          {big}
        </div>
      </div>
      <div style={{...enter(lbl), textAlign: 'center'}}>
        <div style={{fontFamily: brand.fontBody, fontWeight: 700, fontSize: 52, color: brand.text}}>{p.label}</div>
        {p.sublabel ? <div style={{fontFamily: brand.fontBody, fontWeight: 500, fontSize: 36, color: brand.muted, marginTop: 10}}>{p.sublabel}</div> : null}
      </div>
    </div>
  );
};
