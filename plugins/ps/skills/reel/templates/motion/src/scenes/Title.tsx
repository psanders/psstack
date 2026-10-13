// Kicker chip + headline (with *emphasis*) + subtitle, staggered blur-up.
// props: {kicker?, title, subtitle?, align?: 'center'|'left'}
import React from 'react';
import {Brand} from '../brand';
import {between, enter, useSpringAt, useTime} from '../motion';
import {fitSize, Kicker, RichText} from '../ui';

export const Title: React.FC<{brand: Brand; p: Record<string, any>; boxWidth: number; compact?: boolean; card?: boolean}> = ({
  brand,
  p,
  boxWidth,
  compact,
  card,
}) => {
  const t = useTime();
  const k = useSpringAt(0.05);
  const h = useSpringAt(0.18, 'pop');
  const s = useSpringAt(0.42);
  const left = p.align === 'left';
  const title = p.title ?? '';
  const size = p.size ?? fitSize(title, compact ? 96 : 120, 52, boxWidth, compact ? 3 : 4, 0.58);
  // Over live video (overlay layout) the title sits on a dark glass card so it
  // stays legible on any background.
  const glass = card
    ? {padding: '40px 46px', borderRadius: brand.radius, background: 'rgba(10,12,16,0.78)', border: `1.5px solid ${brand.border}`, boxShadow: '0 30px 80px rgba(0,0,0,0.45)', ...enter(k, 30)}
    : {};
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: left ? 'flex-start' : 'center',
        gap: compact ? 26 : 36,
        width: boxWidth,
        textAlign: left ? 'left' : 'center',
        ...glass,
      }}
    >
      {p.kicker ? <div style={enter(k)}><Kicker brand={brand} text={p.kicker} /></div> : null}
      <div
        style={{
          ...enter(h, 50, 14),
          fontFamily: brand.fontDisplay,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.06,
          letterSpacing: -1.5,
          color: brand.text,
        }}
      >
        <RichText brand={brand} text={title} sweep={between(t, 0.45, 0.95)} />
      </div>
      {p.subtitle ? (
        <div
          style={{
            ...enter(s),
            fontFamily: brand.fontBody,
            fontWeight: 500,
            fontSize: compact ? 38 : 44,
            lineHeight: 1.3,
            color: brand.muted,
            maxWidth: boxWidth * 0.92,
          }}
        >
          {p.subtitle}
        </div>
      ) : null}
    </div>
  );
};
