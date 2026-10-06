// Fonts come from public/fonts (mg_render.py copies them from $REEL_CACHE/fonts), so renders
// never depend on Google Fonts and match the captions exactly.
const faces = [
  {family: 'Inter', file: 'public/fonts/Inter.ttf', weight: '100 900'},
  {family: 'Poppins', file: 'public/fonts/Poppins-SemiBold.ttf', weight: '600'},
  {family: 'Poppins', file: 'public/fonts/Poppins-Bold.ttf', weight: '700'},
  {family: 'Poppins', file: 'public/fonts/Poppins-ExtraBold.ttf', weight: '800'},
  {family: 'JetBrains Mono', file: 'public/fonts/JetBrainsMono.ttf', weight: '100 800'},
];

export const loadFonts = () =>
  Promise.all(
    faces.map(async (f) => {
      try {
        const face = new FontFace(f.family, `url(${f.file})`, {weight: f.weight});
        document.fonts.add(await face.load());
      } catch {
        /* missing font: the browser falls back; QA's visual review will catch it */
      }
    }),
  );
