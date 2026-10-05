// Bespoke scenes for ONE reel live here (mg_render.py never overwrites this folder).
// Register a component and use it from reel.json with "scene": "custom:<Name>".
// Each receives {brand, p, cues, boxWidth, maxHeight, lang, enter, exit}. Build them from
// ../motion (ramp, pulse, shake, cue, sceneIO, EASE) and ../ui so they move like the stock
// scenes; scenes/Story.tsx is the reference for choreographed scenes. Set
// `Component.bare = true` to draw on the fixed 1080x960 stage with absolute positions. Example:
//
//   import {Flow} from './Flow';
//   export const CUSTOM = {Flow};
import type React from 'react';

export const CUSTOM: Record<string, React.FC<any>> = {};
