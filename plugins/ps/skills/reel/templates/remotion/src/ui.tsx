// Shared building blocks: background, layout frames, cards, chips, icons, text.
import {
  AudioLines,
  Bot,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  FileCheck,
  FileText,
  Headset,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Mic,
  Phone,
  Play,
  Route,
  ScanSearch,
  Send,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  User,
  Voicemail,
  X,
  type LucideIcon,
} from 'lucide-react';
import React, {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, Brand} from './brand';
import {segments, SPRINGS, useExit, useSpringAt} from './motion';

export const ICONS: Record<string, LucideIcon> = {
  sms: MessageSquare,
  message: MessageSquare,
  whatsapp: MessageCircle,
  chat: MessageSquareText,
  phone: Phone,
  mobile: Smartphone,
  mail: Mail,
  email: Mail,
  voice: Voicemail,
  voicemail: Voicemail,
  mic: Mic,
  bot: Bot,
  ai: Bot,
  user: User,
  human: User,
  agent: Headset,
  headset: Headset,
  send: Send,
  play: Play,
  check: Check,
  ok: CircleCheck,
  fail: CircleX,
  x: X,
  clock: Clock,
  duration: AudioLines,
  wave: AudioLines,
  alert: TriangleAlert,
  route: Route,
  file: FileText,
  evidence: FileCheck,
  audit: ScanSearch,
  shield: ShieldCheck,
};

export const Icon: React.FC<{name: string; size?: number; color?: string; stroke?: number; fill?: string}> = ({
  name,
  size = 40,
  color = 'currentColor',
  stroke = 2,
  fill = 'none',
}) => {
  const C = ICONS[name] ?? MessageSquareText;
  return <C size={size} color={color} strokeWidth={stroke} fill={fill} />;
};

/** Radial glow + dot grid. Static on purpose: back-to-back beats join seamlessly. */
export const Background: React.FC<{brand: Brand}> = ({brand}) => (
  <AbsoluteFill style={{background: `radial-gradient(900px 600px at 50% 35%, ${brand.bgGlow} 0%, ${brand.bg} 70%)`}}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${alpha('#ffffff', 0.07)} 1.5px, transparent 1.5px)`,
        backgroundSize: '36px 36px',
        opacity: 0.6,
      }}
    />
  </AbsoluteFill>
);

export type Layout = 'overlay' | 'panel' | 'full';
export type Position = 'top' | 'center' | 'bottom';

// Safe zones for 9:16 feeds (px at 1080x1920). Platform UI covers the top bar,
// the right-hand action rail and the caption/handle block at the bottom.
export const SAFE = {top: 230, bottom: 430, side: 70, rail: 150};

/**
 * Places scene content for the beat's layout:
 *  - full:    opaque 1080x1920 cutaway with background
 *  - panel:   opaque top half (the speaker stays visible in the bottom half)
 *  - overlay: transparent; content floats at top/center/bottom inside the safe zone
 * `bare` scenes draw on a fixed 1080x960 stage with absolute positions (the
 * choreographed "story" scenes); others are centered in a padded box.
 */
export const Frame: React.FC<{
  layout: Layout;
  position?: Position;
  brand: Brand;
  enter?: boolean;
  exit?: boolean;
  bare?: boolean | 'canvas';
  seam?: boolean;
  stageScale?: number;
  children: ReactNode;
}> = ({layout, position = 'bottom', brand, enter = true, exit = true, bare = false, seam = false, stageScale = 0.8, children}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const inSpring = useSpringAt(0, 'smooth');
  const inP = enter ? inSpring : 1;
  const out = useExit(0.3, exit);

  const stage = (h: number) =>
    bare ? (
      <div style={{position: 'absolute', left: 0, top: (h - 960) / 2, width: 1080, height: 960}}>{children}</div>
    ) : (
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: h > 1000 ? `${SAFE.top}px ${SAFE.side + 20}px ${SAFE.bottom - 80}px` : `${Math.round(SAFE.top * 0.6)}px ${SAFE.side}px 56px`,
        }}
      >
        {children}
      </AbsoluteFill>
    );

  if (layout === 'full') {
    return (
      <AbsoluteFill style={{opacity: Math.min(inP * 1.6, 1) * out}}>
        <Background brand={brand} />
        {stage(height)}
      </AbsoluteFill>
    );
  }

  if (layout === 'panel') {
    const h = height / 2;
    // the panel wipes in from the seam at the start of a run of panel beats, and back out at the end
    const reveal = Math.min(inP, out);
    const seamGlow = interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateRight: 'clamp'}) * out;
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: 0, width, height: h, overflow: 'hidden', clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`}}>
          <Background brand={brand} />
          {stage(h)}
        </div>
        {seam ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: h - 2,
              width,
              height: 4,
              background: `linear-gradient(90deg, transparent, ${brand.accent}, transparent)`,
              opacity: seamGlow * 0.9,
              boxShadow: `0 0 24px ${alpha(brand.accent, 0.8)}`,
            }}
          />
        ) : null}
      </AbsoluteFill>
    );
  }

  // overlay
  if (bare === 'canvas') return <AbsoluteFill style={{opacity: out}}>{children}</AbsoluteFill>;
  if (bare) {
    // a choreographed stage floating over the speaker: scaled down, placed in the safe zone
    const k = stageScale;
    const top = position === 'top' ? SAFE.top : position === 'center' ? (height - 960 * k) / 2 : height - SAFE.bottom - 960 * k;
    return (
      <AbsoluteFill style={{opacity: out}}>
        <div style={{position: 'absolute', left: (width - 1080 * k) / 2, top, width: 1080, height: 960, transform: `scale(${k})`, transformOrigin: 'top left'}}>
          {children}
        </div>
      </AbsoluteFill>
    );
  }
  const justify = position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
  return (
    <AbsoluteFill
      style={{
        justifyContent: justify,
        alignItems: 'center',
        padding: `${SAFE.top}px ${SAFE.rail}px ${SAFE.bottom}px ${SAFE.side}px`,
        opacity: out,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Card: React.FC<{brand: Brand; style?: CSSProperties; children?: ReactNode; glow?: boolean}> = ({
  brand,
  style,
  children,
  glow,
}) => (
  <div
    style={{
      background: brand.surface,
      border: `1px solid ${brand.border}`,
      borderRadius: brand.radius,
      boxShadow: `0 30px 80px rgba(0,0,0,0.45)${glow ? `, 0 0 60px ${alpha(brand.accent, 0.12)}` : ''}`,
      color: brand.text,
      fontFamily: brand.fontBody,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{brand: Brand; text: string; style?: CSSProperties}> = ({brand, text, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 26px',
      borderRadius: 999,
      background: brand.surface2,
      border: `1px solid ${brand.border}`,
      color: brand.text,
      fontFamily: brand.fontBody,
      fontWeight: 700,
      fontSize: 30,
      ...style,
    }}
  >
    <span style={{width: 12, height: 12, borderRadius: 6, background: brand.accent, boxShadow: `0 0 14px ${brand.accent}`}} />
    {text}
  </div>
);

/** Inline emphasized text: "*word*" → accent color (optional highlight sweep behind it). */
export const RichText: React.FC<{
  brand: Brand;
  text: string;
  sweep?: number; // 0..1 progress of the highlight sweep
  color?: string;
  highlight?: boolean;
}> = ({brand, text, sweep = 1, color, highlight = false}) => (
  <>
    {segments(text).map((sg, i) =>
      sg.emph ? (
        <span key={i} style={{position: 'relative', color: brand.accent}}>
          {highlight ? (
            <span
              style={{
                position: 'absolute',
                left: -6,
                right: -6,
                bottom: '0.06em',
                height: '0.34em',
                borderRadius: 8,
                background: alpha(brand.accent, 0.22),
                transform: `scaleX(${sweep})`,
                transformOrigin: 'left center',
              }}
            />
          ) : null}
          <span style={{position: 'relative'}}>{sg.t}</span>
        </span>
      ) : (
        <span key={i} style={{color, whiteSpace: 'pre-wrap'}}>
          {sg.t}
        </span>
      ),
    )}
  </>
);

/** Font size that keeps a headline inside its box without measuring the DOM. */
export const fitSize = (text: string, maxPx: number, minPx: number, boxWidth: number, maxLines: number, avgChar = 0.56): number => {
  const chars = Math.max(1, (text ?? '').replace(/\*/g, '').length);
  for (let s = maxPx; s >= minPx; s -= 2) {
    const perLine = Math.max(1, Math.floor(boxWidth / (s * avgChar)));
    if (Math.ceil(chars / perLine) <= maxLines) return s;
  }
  return minPx;
};

export {SPRINGS};
