// Thumbnail / cover still: headline, chips, and up to three fanned phone frames
// showing stills from the reel (speaker frames + motion-graphics frames).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from './animations';
import {alpha, resolveBrand} from './brand';
import type {CoverProps} from './schema';
import {Background, fitSize, Kicker, RichText} from './ui';

export const Cover: React.FC<CoverProps> = (props) => {
  const brand = resolveBrand(props.brand);
  const {width, height} = props;
  const imgs = (props.images ?? []).slice(0, 3);
  const layout = props.layout ?? (imgs.length >= 2 ? 'fan' : imgs.length === 1 ? 'single' : 'none');
  const tall = height / width > 1.5;
  const titleW = width - 140;
  const size = fitSize(props.title, tall ? 122 : 104, 60, titleW, 3, 0.56);
  const phoneW = layout === 'single' ? width * 0.5 : width * 0.34;
  const phoneH = phoneW * (16 / 9);
  const fan = imgs.length === 3 ? [-1, 0, 1] : imgs.length === 2 ? [-0.5, 0.5] : [0];
  const top = tall ? height * 0.165 : height * 0.1;

  return (
    <AbsoluteFill>
      <Background brand={brand} />
      <div style={{position: 'absolute', left: 70, right: 70, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, textAlign: 'center'}}>
        {props.kicker ? <Kicker brand={brand} text={props.kicker} /> : null}
        <div style={{fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: -2, color: brand.text, textShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
          <RichText brand={brand} text={props.title} />
        </div>
        {props.chips?.length ? (
          <div style={{display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center'}}>
            {props.chips.map((c, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px', borderRadius: 999, background: alpha('#ffffff', 0.06), border: `1.5px solid ${brand.border}`, fontFamily: brand.fontBody, fontWeight: 700, fontSize: 34, color: brand.text}}>
                <span style={{color: brand.accent}}>✓</span>
                {c}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {layout !== 'none' && imgs.length ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: tall ? height * 0.07 : height * 0.04, height: phoneH * 1.08, display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
          {imgs.map((src, i) => {
            const k = fan[i];
            const center = k === 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: width / 2 - phoneW / 2 + k * phoneW * 0.78,
                  bottom: center ? 30 : 0,
                  width: phoneW,
                  height: phoneH,
                  borderRadius: phoneW * 0.11,
                  padding: phoneW * 0.025,
                  background: '#05070a',
                  border: `2px solid ${alpha('#ffffff', 0.14)}`,
                  boxShadow: `0 40px 90px rgba(0,0,0,0.6)${center ? `, 0 0 70px ${alpha(brand.accent, 0.25)}` : ''}`,
                  transform: `rotate(${k * 7}deg) scale(${center ? 1.06 : 0.94})`,
                  transformOrigin: 'bottom center',
                  zIndex: center ? 3 : 1,
                  overflow: 'hidden',
                }}
              >
                <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: phoneW * 0.09}} />
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
