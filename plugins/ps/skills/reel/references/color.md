# Color and HDR

iPhones record **HDR (HLG, BT.2020, 10-bit)** by default. Pedro wants the reel to look
exactly like the phone's original — so the pipeline keeps HLG end to end and only makes
SDR copies for platforms that need them, with a tone map validated against how macOS
displays the original.

## Pipeline

| Step | HLG source | SDR source |
| :--- | :--- | :--- |
| `cut.py` pieces | 10-bit ProRes 422 HQ, tagged bt2020 / arib-std-b67 | 10-bit ProRes, bt709 |
| graphics (`assemble.py`) | sRGB → `HLG_GRAPHICS_CCM` (709→2020 primaries ×0.75 = HLG graphics white) | sRGB → bt709 |
| captions | same mapping as graphics | bt709 |
| HDR master (`master_<lang>_hdr`) | 10-bit ProRes 422 HQ, HLG — only when an export keeps HDR | — |
| SDR master (`master_<lang>_sdr`) | footage through `HLG_TO_SDR` **first**, then graphics/captions in bt709 | 10-bit ProRes, bt709 |
| Instagram export | from the HDR master: HEVC Main10, HLG tags, `hvc1` | H.264 |
| X / LinkedIn / TikTok | from the SDR master → H.264 bt709 | H.264 bt709 |

Why two masters: tone-mapping a finished HDR master also tone-maps the graphics, and
graphics white (HLG ~75 %) lands at ~60 % gray in SDR — dim, muddy panels. Tone-mapping
only the footage and compositing graphics in SDR keeps both right. `assemble.py` builds
both in one ffmpeg pass.

PQ (HDR10) sources are converted to HLG in `cut.py` (experimental — check the SDR
preview against the original).

## Rules

- **Never** convert HDR to SDR with a plain `scale=…:out_color_matrix=bt709` or
  `colormatrix`: skin turns yellow and highlights clip. Use `HLG_TO_SDR` from
  `reel_common.py` (zscale linearize → bt709 primaries → Reinhard tone map → sRGB).
- Don't use `zoompan` on HDR (forces 8-bit). `cut.py` zooms with a per-frame `scale` + `crop`.
- Keep 10-bit intermediates; only the final exports are 8-bit (SDR) or 10-bit (HEVC).
- Previews (`*_preview.mp4`) are SDR via the same tone map, so what you review matches
  the SDR exports. The HDR files will look brighter on HDR phones; that's expected.
- Graphics white maps to ~75 % HLG signal. If graphics look dim or glaring next to the
  footage, adjust the ×0.75 scale in `HLG_GRAPHICS_CCM`, not the graphics' colors.
