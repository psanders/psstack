// One storyboard beat = one composition render. Dispatches to a scene and
// wraps it in the layout frame (overlay / panel / full).
import React from 'react';
import {AbsoluteFill} from './animations';
import {resolveBrand} from './brand';
import {CUSTOM} from './custom';
import {Checklist} from './scenes/Checklist';
import {Kinetic} from './scenes/Kinetic';
import {Channels, Cta, LowerThird} from './scenes/Misc';
import {Stat} from './scenes/Stat';
import {Evidence, Pill, Recording, Records, Sent, Transcript} from './scenes/Story';
import {Title} from './scenes/Title';
import type {BeatProps} from './schema';
import {Frame, SAFE} from './ui';

// Choreographed scenes draw on a fixed stage with absolute positions.
const STORY: Record<string, React.FC<any>> = {
  evidence: Evidence,
  sent: Sent,
  chat: Transcript,
  transcript: Transcript,
  recording: Recording,
  metadata: Records,
  records: Records,
  pill: Pill,
};

export const Beat: React.FC<BeatProps> = (props) => {
  const brand = resolveBrand(props.brand);
  const {layout, scene, width, height} = props;
  const p = props.props ?? {};
  const enter = props.enter !== false;
  const exit = props.exit !== false;
  const boxWidth =
    layout === 'full' ? width - 2 * (SAFE.side + 20) : layout === 'panel' ? width - 2 * SAFE.side : width - SAFE.side - SAFE.rail;
  const maxHeight = layout === 'full' ? height - SAFE.top - SAFE.bottom + 80 : layout === 'panel' ? height / 2 - Math.round(SAFE.top * 0.6) - 56 : height - SAFE.top - SAFE.bottom;
  const compact = layout !== 'full';
  let bare: boolean | 'canvas' = false;

  let body: React.ReactNode;
  if (scene.startsWith('custom:')) {
    const C = CUSTOM[scene.slice(7)];
    bare = Boolean((C as any)?.bare);
    body = C ? <C brand={brand} p={p} cues={props.cues} boxWidth={boxWidth} maxHeight={maxHeight} lang={props.lang} enter={enter} exit={exit} /> : <Missing name={scene} />;
  } else if (STORY[scene]) {
    const S = STORY[scene];
    bare = scene === 'pill' ? 'canvas' : true;
    body = <S brand={brand} p={p} cues={props.cues} enter={enter} exit={exit} />;
  } else {
    switch (scene) {
      case 'kinetic':
        body = <Kinetic brand={brand} p={p} tokens={props.tokens} boxWidth={boxWidth} />;
        break;
      case 'title':
        body = <Title brand={brand} p={p} boxWidth={boxWidth} compact={compact} card={layout === 'overlay' && p.card !== false} />;
        break;
      case 'checklist':
        body = <Checklist brand={brand} p={p} boxWidth={boxWidth} />;
        break;
      case 'stat':
        body = <Stat brand={brand} p={p} boxWidth={boxWidth} />;
        break;
      case 'channels':
        body = <Channels brand={brand} p={p} boxWidth={boxWidth} />;
        break;
      case 'lowerthird':
        body = <LowerThird brand={brand} p={p} />;
        break;
      case 'cta':
        body = <Cta brand={brand} p={p} boxWidth={boxWidth} />;
        break;
      default:
        body = <Missing name={scene} />;
    }
  }

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <Frame layout={layout} position={props.position} brand={brand} enter={enter} exit={exit} bare={bare} seam={p.seam === true} stageScale={p.scale ?? 0.8}>
        {body}
      </Frame>
    </AbsoluteFill>
  );
};

const Missing: React.FC<{name: string}> = ({name}) => (
  <div style={{padding: 40, background: '#7f1d1d', color: 'white', fontSize: 40, fontFamily: 'Inter', borderRadius: 20}}>
    Unknown scene “{name}”
  </div>
);
