import React from 'react';
import {Composition} from 'remotion';
import {Beat} from './Beat';
import {Cover} from './Cover';
import './fonts';
import {BeatProps, CoverProps, defaultBeat, defaultCover} from './schema';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Beat"
      component={Beat}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      defaultProps={defaultBeat}
      calculateMetadata={({props}: {props: BeatProps}) => ({
        durationInFrames: Math.max(1, Math.round(props.duration * props.fps)),
        fps: props.fps,
        width: props.width,
        height: props.height,
      })}
    />
    <Composition
      id="Cover"
      component={Cover}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1}
      defaultProps={defaultCover}
      calculateMetadata={({props}: {props: CoverProps}) => ({width: props.width, height: props.height})}
    />
  </>
);
