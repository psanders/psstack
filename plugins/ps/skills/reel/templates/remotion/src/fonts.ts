// Fonts come from public/fonts (mg_render.py copies them from $REEL_CACHE/fonts),
// so renders never depend on Google Fonts being reachable and match the captions.
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const faces = [
  {family: 'Inter', file: 'fonts/Inter.ttf', weight: '100 900'},
  {family: 'Poppins', file: 'fonts/Poppins-SemiBold.ttf', weight: '600'},
  {family: 'Poppins', file: 'fonts/Poppins-Bold.ttf', weight: '700'},
  {family: 'Poppins', file: 'fonts/Poppins-ExtraBold.ttf', weight: '800'},
  {family: 'JetBrains Mono', file: 'fonts/JetBrainsMono.ttf', weight: '100 800'},
];

export const fontsReady = Promise.all(
  faces.map((f) => loadFont({family: f.family, url: staticFile(f.file), weight: f.weight}).catch(() => undefined)),
);
