// Choreographed "story" scenes, ported from the hand-built QCobro reel (HTML + GSAP).
// Each one is a small story with named cues — moments that land on spoken words —
// not just an entrance. Stage: 1080x960 (panel); absolute positions like the original.
import React from 'react';
import {alpha, Brand} from '../brand';
import {cue, EASE, pulse, ramp, sceneIO, shake, useTime} from '../motion';
import {getLength} from '../animations';
import {Icon, RichText} from '../ui';
import {useVideoConfig} from '../animations';

type P = {brand: Brand; p: Record<string, any>; cues?: Record<string, number>; enter?: boolean; exit?: boolean};

const useIO = (enter = true, exit = true) => {
  const t = useTime();
  const {durationInFrames, fps} = useVideoConfig();
  return {t, dur: durationInFrames / fps, io: sceneIO(t, durationInFrames / fps, enter, exit)};
};

const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({position: 'absolute', left, top, ...extra});

// ------------------------------------------------------------------ evidence
// Channel tiles pop in along an arc → wires draw from every channel into one
// "evidence" card → a check stamp lands (cue: stamp).
// props: {title: "Cualquier *canal*", channels: [{icon, label}], result: {label, icon?}}
// cues:  converge (wires + card), stamp
export const Evidence: React.FC<P> = ({brand, p, cues, enter, exit}) => {
  const {t, io} = useIO(enter, exit);
  const ch: any[] = (p.channels ?? []).slice(0, 7);
  const n = Math.max(1, ch.length);
  const conv = cue(cues, 'converge', 3.6);
  const stampAt = cue(cues, 'stamp', conv + 0.9);
  const pos = ch.map((_, i) => {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const cx = 135 + u * 810;
    const y = 165 + 50 * Math.pow((u - 0.5) * 2, 2);
    return [cx, y];
  });
  const card = ramp(t, conv, 0.4, EASE.back(1.6));
  const stamp = ramp(t, stampAt, 0.35, EASE.back(3));
  const ring = pulse(t, stampAt, 0.3);
  return (
    <div style={{position: 'absolute', inset: 0, ...io}}>
      <div style={{...abs(0, 64), right: 0, textAlign: 'center', fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 40, color: brand.text,
        opacity: ramp(t, 0.05, 0.4), transform: `translateY(${(1 - ramp(t, 0.05, 0.4)) * -20}px)`}}>
        <RichText brand={brand} text={p.title ?? ''} />
      </div>
      <svg width={1080} height={960} style={{position: 'absolute', inset: 0}}>
        {pos.map(([cx, y], i) => {
          const sx = cx, sy = y + 184, ex = 540, ey = 560;
          const k = ramp(t, conv + 0.15 + i * 0.04, 0.55, EASE.p2inout);
          const d = `M${sx},${sy} C${sx},${sy + 120} ${ex},${ey - 140} ${ex},${ey}`;
          const L = getLength(d);
          return (
            <path key={i} d={d} fill="none" stroke={brand.accent}
              strokeWidth={4} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - k)} opacity={k > 0 ? 0.85 : 0} />
          );
        })}
      </svg>
      {ch.map((c, i) => {
        const [cx, y] = pos[i];
        const s = ramp(t, 0.15 + i * 0.16, 0.35, EASE.back(2));
        const l = ramp(t, 0.3 + i * 0.16, 0.3);
        return (
          <React.Fragment key={i}>
            <div style={{...abs(cx - 68, y, {width: 136, height: 136, borderRadius: 32, background: brand.surface2, border: `1px solid ${brand.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: s > 0 ? Math.min(1, s * 1.4) : 0, transform: `scale(${0.5 + 0.5 * s})`})}}>
              <Icon name={c.icon ?? 'chat'} size={62} color={brand.text} />
            </div>
            <div style={{...abs(cx - 110, y + 146, {width: 220, textAlign: 'center', fontFamily: brand.fontBody, fontWeight: 600, fontSize: 24, color: brand.muted, opacity: l})}}>
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{...abs(390, 560, {width: 300, height: 250, borderRadius: brand.radius, background: brand.surface, border: `1px solid ${brand.border}`,
        boxShadow: `0 30px 80px rgba(0,0,0,.45), 0 0 0 ${18 * ring}px ${alpha(brand.accent, 0.18)}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        opacity: card > 0 ? Math.min(1, card * 1.5) : 0, transform: `scale(${0.8 + 0.2 * card})`})}}>
        <Icon name={p.result?.icon ?? 'evidence'} size={92} color={brand.accent} />
        <b style={{fontFamily: brand.fontDisplay, fontSize: 34, fontWeight: 800, color: brand.text}}>{p.result?.label ?? 'Evidence'}</b>
        <div style={{...abs(300 - 84 + 26, -26, {width: 84, height: 84, borderRadius: 42, background: brand.accent, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: `0 0 0 10px ${alpha(brand.accent, 0.18)}`, transform: `scale(${stamp}) rotate(${(1 - stamp) * -40}deg)`})}}>
          <Icon name="check" size={50} color={brand.onAccent} stroke={3} />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ sent
// Fire-and-forget message: phone composes → paper plane flies with a trail →
// the stored message record slides in → bubble pulses on its word → "saved" badge.
// props: {chip, preview, title, message, metaLeft, metaRight, saved}
// cues:  send, highlight, saved
export const Sent: React.FC<P> = ({brand, p, cues, enter, exit}) => {
  const {t, io} = useIO(enter, exit);
  const send = cue(cues, 'send', 1.65);
  const hl = cue(cues, 'highlight', send + 2.2);
  const sv = cue(cues, 'saved', send + 2.7);
  const chip = ramp(t, 0.1, 0.35);
  const phone = ramp(t, 0.2, 0.4);
  const pm = ramp(t, 0.6, 0.3) * (1 - 0.6 * ramp(t, send + 0.2, 0.3));
  const planeIn = ramp(t, send, 0.3, EASE.p2out);
  const fly = ramp(t, send + 0.3, 0.6, EASE.p2in);
  const gone = 1 - ramp(t, send + 0.9, 0.2);
  const log = ramp(t, send + 0.85, 0.45);
  const bub = ramp(t, send + 1.1, 0.35);
  const ring = pulse(t, hl, 0.35);
  const saved = ramp(t, sv, 0.35, EASE.back(2));
  return (
    <div style={{position: 'absolute', inset: 0, ...io}}>
      <div style={{...abs(540, 70 + (1 - chip) * -20, {transform: 'translateX(-50%)', opacity: chip, display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 26px', borderRadius: 999, background: brand.surface2, border: `1px solid ${brand.border}`, fontFamily: brand.fontBody, fontWeight: 700,
        fontSize: 30, color: brand.text, whiteSpace: 'nowrap'})}}>
        <Icon name="send" size={34} color={brand.accent} />
        {p.chip}
      </div>
      <div style={{...abs(90 + (1 - phone) * -60, 250, {width: 270, height: 470, borderRadius: 44, background: brand.surface2, border: `2px solid ${brand.border}`, opacity: phone})}}>
        <div style={abs(95, 16, {width: 80, height: 10, borderRadius: 6, background: brand.border})} />
        <div style={{...abs(22, 120 + (1 - Math.min(1, ramp(t, 0.6, 0.3))) * 20 - 10 * ramp(t, send + 0.2, 0.3), {right: 22, width: 222, padding: '16px 18px',
          borderRadius: '18px 18px 18px 6px', background: brand.humanBg, border: `1px solid ${brand.border}`, fontFamily: brand.fontBody, fontSize: 21, fontWeight: 600,
          lineHeight: 1.3, color: '#d6dbe3', opacity: pm})}}>
          {p.preview}
        </div>
        <div style={{...abs(22, 470 - 30 - 64, {width: 222, height: 64, borderRadius: 32, background: brand.humanBg, border: `1px solid ${brand.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10})}}>
          <div style={{width: 46, height: 46, borderRadius: 23, background: brand.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="send" size={26} color={brand.onAccent} />
          </div>
        </div>
      </div>
      <div style={abs(330, 440, {width: 170 * fly, height: 4, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${brand.accent})`, opacity: gone})} />
      <div style={abs(300, 390, {width: 90, height: 90, opacity: planeIn * gone, transform: `translate(${-180 * (1 - planeIn) + 120 * fly}px, ${-40 * fly}px)`})}>
        <Icon name="send" size={90} color={brand.accent} />
      </div>
      <div style={{...abs(470 + (1 - log) * 60, 230, {width: 520, height: 520, padding: 34, borderRadius: brand.radius, background: brand.surface,
        border: `1px solid ${brand.border}`, boxShadow: '0 30px 80px rgba(0,0,0,.45)', opacity: log, fontFamily: brand.fontBody, color: brand.text})}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 700, fontSize: 30}}>
          <Icon name="message" size={36} color={brand.accent} />
          {p.title}
        </div>
        <div style={{marginTop: 28, padding: '24px 26px', borderRadius: '24px 24px 6px 24px', background: brand.okBg, border: `1px solid ${brand.okBorder}`,
          color: brand.okText, fontSize: 27, lineHeight: 1.35, fontWeight: 600, opacity: bub, transform: `translateY(${(1 - bub) * 20}px)`,
          boxShadow: `0 0 0 ${8 * ring}px ${alpha(brand.accent, 0.35)}`}}>
          {p.message}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 26, fontSize: 24, color: brand.muted, fontWeight: 600, opacity: bub}}>
          <span>{p.metaLeft}</span>
          <span style={{color: brand.accent}}>{p.metaRight}</span>
        </div>
        {p.saved ? (
          <div style={{marginTop: 30, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 14, background: alpha(brand.accent, 0.14),
            color: brand.accent, fontWeight: 700, fontSize: 26, opacity: Math.min(1, saved * 1.5), transform: `scale(${0.8 + 0.2 * saved})`, transformOrigin: 'left center'}}>
            <Icon name="evidence" size={30} color={brand.accent} />
            {p.saved}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ transcript
// Conversation with avatars; human turns light up on cue "human", AI turns on cue "ai",
// and the card pushes in slowly (cue "push").
// props: {title, channel?, messages: [{from: 'human'|'ai', name?, text, at?}]}
export const Transcript: React.FC<P> = ({brand, p, cues, enter, exit}) => {
  const {t, io} = useIO(enter, exit);
  const msgs: any[] = p.messages ?? [];
  const times = msgs.map((m, i) => (typeof m.at === 'number' ? m.at : cue(cues, `m${i + 1}`, 0.37 + i * 1.0)));
  const hHu = cue(cues, 'human', 1e9);
  const hAi = cue(cues, 'ai', 1e9);
  const hu = ramp(t, hHu, 0.3) * (1 - ramp(t, Math.min(hAi - 0.2, hHu + 1.23), 0.3));
  const ai = ramp(t, hAi, 0.3);
  const push = ramp(t, cue(cues, 'push', 1e9), 3.2, EASE.linear);
  return (
    <div style={{position: 'absolute', inset: 0, ...io}}>
      <div style={{...abs(100, 150, {width: 880, height: 700, padding: '34px 36px', borderRadius: brand.radius, background: brand.surface, border: `1px solid ${brand.border}`,
        boxShadow: '0 30px 80px rgba(0,0,0,.45)', overflow: 'hidden', fontFamily: brand.fontBody, color: brand.text, transform: `scale(${1 + 0.04 * push})`})}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 700, fontSize: 30}}>
          <Icon name={p.channel ?? 'whatsapp'} size={36} color={brand.accent} />
          {p.title}
        </div>
        {msgs.map((m, i) => {
          const isAi = m.from === 'ai';
          const k = ramp(t, times[i], 0.35);
          const lit = isAi ? ai : hu;
          return (
            <div key={i} style={{display: 'flex', flexDirection: isAi ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 16, marginTop: 22, opacity: k,
              transform: `translateY(${(1 - k) * 24}px)`}}>
              <div style={{width: 62, height: 62, borderRadius: 31, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isAi ? alpha(brand.accent2, 0.16) : '#2a2f3a'}}>
                <Icon name={isAi ? 'bot' : 'user'} size={34} color={isAi ? brand.accent2 : brand.text} />
              </div>
              <div>
                <div style={{fontSize: 20, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, color: isAi ? brand.accent2 : brand.muted,
                  textAlign: isAi ? 'right' : 'left'}}>{m.name ?? (isAi ? 'AI' : 'Customer')}</div>
                <div style={{maxWidth: 560, padding: '20px 24px', borderRadius: 24, fontSize: 28, lineHeight: 1.3, fontWeight: 600,
                  background: isAi ? brand.aiBg : brand.humanBg, color: isAi ? brand.aiText : brand.text,
                  border: `1px solid ${isAi ? brand.aiBorder : lit > 0.01 ? brand.text : brand.border}`,
                  ...(isAi ? {borderBottomRightRadius: 6} : {borderBottomLeftRadius: 6}),
                  boxShadow: isAi ? `0 0 0 ${7 * lit}px ${alpha(brand.accent2, 0.35)}` : `0 0 0 ${6 * lit}px rgba(255,255,255,.14)`}}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ recording
// Call recording: play button presses, waveform fills behind the playhead, timer runs.
// props: {title, meta, length (s)}   cues: play
export const Recording: React.FC<P> = ({brand, p, cues, enter, exit}) => {
  const {t, dur, io} = useIO(enter, exit);
  const play = cue(cues, 'play', 0.1);
  const prog = ramp(t, play, Math.max(0.5, dur - play - 0.3), EASE.linear);
  const press = pulse(t, play + 0.15, 0.12);
  const len = Number(p.length ?? 7);
  const NB = 46;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div style={{position: 'absolute', inset: 0, ...io}}>
      <div style={{...abs(90, 220, {width: 900, height: 470, borderRadius: brand.radius, background: brand.surface, border: `1px solid ${brand.border}`,
        boxShadow: '0 30px 80px rgba(0,0,0,.45)', fontFamily: brand.fontBody, color: brand.text})}}>
        <div style={{...abs(44, 44), display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, fontWeight: 800}}>
          <Icon name="mic" size={42} color={brand.accent} />
          {p.title}
        </div>
        <div style={{...abs(104, 92), fontSize: 24, color: brand.muted, fontWeight: 600}}>{p.meta}</div>
        <div style={{...abs(44, 170, {width: 130, height: 130, borderRadius: 65, background: brand.accent, display: 'flex', alignItems: 'center',
          justifyContent: 'center', transform: `scale(${1 - 0.1 * press})`})}}>
          <div style={{marginLeft: 8, display: 'flex'}}><Icon name="play" size={58} color={brand.onAccent} fill={brand.onAccent} /></div>
        </div>
        <div style={{...abs(210, 150, {width: 640, height: 170, display: 'flex', alignItems: 'center', gap: 7})}}>
          {Array.from({length: NB}).map((_, i) => {
            const h = 18 + Math.abs(Math.sin(i * 0.9 + t * 7)) * 70 + Math.abs(Math.sin(i * 0.37 + t * 3.1)) * 60;
            return <i key={i} style={{display: 'block', width: 9, height: h, borderRadius: 6, background: i / NB < prog ? brand.accent : '#3a4050'}} />;
          })}
        </div>
        <div style={{...abs(210, 350), fontSize: 28, fontWeight: 700, color: brand.muted, fontVariantNumeric: 'tabular-nums'}}>
          {fmt(Math.min(len, prog * len))} / {fmt(len)}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ records
// Data rows load as shimmering skeletons, then fill in one by one on their cues; a row
// can flip state (Delivered → Not delivered, with a shake) and change its value later.
// props: {title, icon?, rows: [{icon, k, v, tone: ok|fail|info|warn, at?,
//          flip?: {v, tone, icon, at?}, change?: {v, at?}}]}
// cues:  rowN (reveal row N, 1-based), flip, change, push, pulse (+ p.pulseRow index)
const TONE = (b: Brand, tone: string) =>
  tone === 'ok' ? {bg: alpha(b.accent, 0.14), fg: b.accent, v: b.accent} :
  tone === 'fail' ? {bg: alpha(b.danger, 0.15), fg: b.danger, v: b.danger} :
  tone === 'warn' ? {bg: alpha(b.warn, 0.15), fg: b.warn, v: b.warn} :
  {bg: '#1f2a3d', fg: b.info, v: b.text};

export const Records: React.FC<P> = ({brand, p, cues, enter, exit}) => {
  const {t, io} = useIO(enter, exit);
  const rows: any[] = p.rows ?? [];
  const push = ramp(t, cue(cues, 'push', 1e9), 1.2, EASE.p2inout);
  const pulseAt = cue(cues, 'pulse', 1e9);
  const pulseRow = p.pulseRow ?? rows.length - 1;
  return (
    <div style={{position: 'absolute', inset: 0, ...io}}>
      <div style={{...abs(90, 120, {width: 900, minHeight: 300, padding: '40px 44px', borderRadius: brand.radius, background: brand.surface,
        border: `1px solid ${brand.border}`, boxShadow: '0 30px 80px rgba(0,0,0,.45)', transformOrigin: '50% 40%', transform: `scale(${1 + 0.06 * push})`,
        fontFamily: brand.fontBody, color: brand.text})}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, fontWeight: 800, fontSize: 36, opacity: ramp(t, 0.1, 0.35), transform: `translateX(${(1 - ramp(t, 0.1, 0.35)) * -30}px)`}}>
          <Icon name={p.icon ?? 'route'} size={44} color={brand.accent} />
          {p.title}
        </div>
        {rows.map((r, k) => {
          const sk = ramp(t, 0.65 + k * 0.12, 0.3);
          const at = typeof r.at === 'number' ? r.at : cue(cues, `row${k + 1}`, 1.6 + k * 0.6);
          const rev = ramp(t, at, 0.35);
          const skel = 1 - ramp(t, at, 0.2);
          const pop = pulse(t, at, 0.18);
          const fl = r.flip ? ramp(t, typeof r.flip.at === 'number' ? r.flip.at : cue(cues, 'flip', at + 0.8), 0.25) : 0;
          const chAt = r.change ? (typeof r.change.at === 'number' ? r.change.at : cue(cues, 'change', 1e9)) : 1e9;
          const chOut = ramp(t, chAt - 0.15, 0.15, EASE.linear);
          const chIn = ramp(t, chAt, 0.15, EASE.linear);
          const value = t >= chAt ? r.change.v : r.v;
          const vOpacity = r.change ? (t < chAt ? 1 - chOut : chIn) : 1;
          const a = TONE(brand, r.tone ?? 'info');
          const b = r.flip ? TONE(brand, r.flip.tone ?? 'fail') : a;
          const sh = r.flip ? shake(t, typeof r.flip.at === 'number' ? r.flip.at : cue(cues, 'flip', at + 0.8) + 0.05) : 0;
          const ring = k === pulseRow ? pulse(t, pulseAt, 0.35, 2) : 0;
          const shineX = -200 + (((t - (0.9 + k * 0.1)) % 1.3) / 1.1) * 1200;
          return (
            <div key={k} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22, marginTop: 26, padding: '22px 26px', borderRadius: 22,
              background: brand.surface2, border: `1px solid ${brand.border}`, overflow: 'hidden', opacity: sk, height: 108,
              transform: `translate(${sh}px, ${(1 - sk) * 20}px) scale(${1 + 0.03 * pop})`, boxShadow: `0 0 0 ${8 * ring}px ${alpha(brand.warn, 0.3)}`}}>
              {skel > 0.01 ? (
                <>
                  <div style={abs(26, 22, {width: 64, height: 64, borderRadius: 18, background: '#262b36', opacity: skel})} />
                  <div style={abs(112, 34, {width: 300, height: 22, borderRadius: 8, background: '#262b36', opacity: skel})} />
                  <div style={abs(112, 68, {width: 180, height: 16, borderRadius: 8, background: '#20242d', opacity: skel})} />
                  {t > 0.9 + k * 0.1 ? <div style={abs(shineX, 0, {width: 180, height: 108, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent)', opacity: skel})} /> : null}
                </>
              ) : null}
              <div style={{position: 'relative', width: 64, height: 64, borderRadius: 18, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: fl > 0.5 ? b.bg : a.bg, opacity: rev, transform: `translateX(${(1 - rev) * -24}px)`}}>
                <div style={{position: 'absolute', opacity: 1 - fl}}><Icon name={r.icon ?? 'route'} size={36} color={a.fg} /></div>
                {r.flip ? <div style={{position: 'absolute', opacity: fl, transform: `translateY(${(1 - fl) * 10}px)`}}><Icon name={r.flip.icon ?? 'fail'} size={36} color={b.fg} /></div> : null}
              </div>
              <div style={{opacity: rev, transform: `translateX(${(1 - rev) * -24}px)`}}>
                <div style={{fontSize: 22, color: brand.muted, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase'}}>{r.k}</div>
                <div style={{position: 'relative', height: 40, marginTop: 4, fontSize: 32, fontWeight: 800, whiteSpace: 'nowrap'}}>
                  <span style={{position: 'absolute', left: 0, top: 0, color: a.v, opacity: (1 - fl) * vOpacity}}>{value}</span>
                  {r.flip ? <span style={{position: 'absolute', left: 0, top: (1 - fl) * 10, color: b.v, opacity: fl}}>{r.flip.v}</span> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ pill (+ end card)
// A keyword pill that pops over the speaker; optionally drifts up while a wordmark
// end card rises from the bottom (cue: brand).
// props: {text, icon?, y?: number, drift?: boolean, endcard?: {wordmark: "*Q*Cobro", tagline}}
export const Pill: React.FC<P> = ({brand, p, cues}) => {
  const t = useTime();
  const {durationInFrames, fps} = useVideoConfig();
  const dur = durationInFrames / fps;
  const popIn = ramp(t, 0.05, 0.35, EASE.back(2.2));
  const drift = p.drift ? ramp(t, 0.4, 1.6, EASE.linear) : 0;
  const out = p.drift ? 0 : ramp(t, dur - 0.3, 0.3, EASE.p2out);
  const bAt = cue(cues, 'brand', 0.6);
  const fade = p.endcard ? ramp(t, bAt - 0.1, 0.5, EASE.p2out) : 0;
  const card = p.endcard ? ramp(t, bAt, 0.45) : 0;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {p.endcard ? (
        <div style={abs(0, 1300, {width: 1080, height: 620, background: `linear-gradient(180deg, ${alpha(brand.bg, 0)}, ${alpha(brand.bg, 0.9)})`, opacity: fade})} />
      ) : null}
      <div style={{...abs(540, (p.y ?? 1260) - 30 * drift - 20 * out), transform: `translateX(-50%) scale(${0.6 + 0.4 * popIn})`, opacity: Math.min(1, popIn * 1.5) * (1 - out),
        display: 'flex', alignItems: 'center', gap: 20, padding: '24px 40px', borderRadius: 999, background: alpha(brand.bg, 0.82),
        border: `2px solid ${alpha(brand.accent, 0.55)}`, fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 54, letterSpacing: 1, whiteSpace: 'nowrap',
        color: brand.text, boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>
        <Icon name={p.icon ?? 'audit'} size={60} color={brand.accent} />
        {p.text}
      </div>
      {p.endcard ? (
        <div style={{...abs(0, 1520 + (1 - card) * 30), width: 1080, padding: '40px 0 60px', textAlign: 'center', opacity: card,
          background: `linear-gradient(180deg, ${alpha(brand.bg, 0)} 0%, ${alpha(brand.bg, 0.85)} 35%, ${alpha(brand.bg, 0.95)} 100%)`,
          fontFamily: brand.fontDisplay, fontWeight: 800, fontSize: 64, letterSpacing: -1, color: brand.text}}>
          <RichText brand={brand} text={p.endcard.wordmark ?? ''} />
          {p.endcard.tagline ? <small style={{display: 'block', fontSize: 26, fontWeight: 600, color: '#cfd5de', letterSpacing: 1, marginTop: 6}}>{p.endcard.tagline}</small> : null}
        </div>
      ) : null}
    </div>
  );
};
