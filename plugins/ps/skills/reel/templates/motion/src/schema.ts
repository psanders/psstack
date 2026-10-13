// Props contract between mg_render.py and the compositions. mg_render.py has
// already resolved localized strings ({"es","en"} → one string) and beat timing.
import type {Layout, Position} from './ui';

export type TimedToken = {t: string; emph: boolean; at?: number}; // at = seconds into the beat

export type BeatProps = {
  id: string;
  scene: string; // kinetic | title | checklist | stat | chat | recording | metadata | channels | lowerthird | cta | custom:<Name>
  layout: Layout;
  position?: Position;
  duration: number; // seconds
  fps: number;
  width: number;
  height: number;
  lang: string;
  brand: unknown; // preset name or token overrides
  enter?: boolean;
  exit?: boolean;
  tokens?: TimedToken[]; // kinetic: words aligned to the speech
  cues?: Record<string, number>; // named moments, seconds from the beat start (resolved from word anchors)
  props: Record<string, any>; // scene-specific (see references/motion-graphics.md)
};

export type CoverProps = {
  width: number;
  height: number;
  brand: unknown;
  kicker?: string;
  title: string; // *emphasis* supported
  chips?: string[];
  images?: string[]; // files in public/ (mg_render copies them to public/cover/)
  layout?: 'fan' | 'single' | 'none';
};

export const defaultBeat: BeatProps = {
  id: 'demo',
  scene: 'title',
  layout: 'panel',
  duration: 3,
  fps: 30,
  width: 1080,
  height: 1920,
  lang: 'en',
  brand: 'qcobro',
  props: {kicker: 'Audit trail', title: 'Every collection *on the record*', subtitle: 'Messages, transcripts, recordings'},
};

export const defaultCover: CoverProps = {
  width: 1080,
  height: 1920,
  brand: 'qcobro',
  title: 'Can you *audit* every collection your AI makes?',
  chips: ['Recorded', 'Transcribed', 'Traceable'],
  images: [],
  layout: 'none',
};
