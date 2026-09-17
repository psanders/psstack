# Naming — make names parseable

Names are the join key between Ads Manager and the tracker. `review` parses them back into
tags, so keep to the grammar. Lowercase slugs except the `BRAND_OBJ` prefix; `_` separates
fields; `-` joins words inside a field. No spaces, no accents.

## Campaign

`BRAND_OBJ_GEO_YYYY-MM_theme`

| Field | Values |
| :--- | :--- |
| `BRAND` | `QCOBRO`, `FONOSTER`, `KARMA`, … (uppercase) |
| `OBJ` | `LEADS`, `TRAFFIC`, `SALES`, `AWARE`, `ENGAGE`, `WAPP` (WhatsApp conversations) |
| `GEO` | ISO country code(s) joined by `-` (`DO`, `DO-PR`), or `LATAM` |
| `YYYY-MM` | launch month |
| `theme` | 1–3 kebab words (`cobranza-ia`, `demo-cooperativas`) |

Example: `QCOBRO_LEADS_DO_2026-09_cobranza-ia`

## Ad set

`aud-<type>_geo-<GEO>_place-<adv|manual>[_opt-<event>]`

Example: `aud-broad_geo-DO_place-adv_opt-lead`

## Ad

`r<round>_angle-<angle>_fmt-<format>_hook-<slug>_v<n>`

| Field | Values |
| :--- | :--- |
| `r<round>` | test round within the campaign: `r1`, `r2`… |
| `angle` | key from `copy-frameworks.md` (`pain`, `outcome`, `proof`, `objection`, `contrast`, `curiosity`, `demo`) |
| `fmt` | `static-4x5`, `static-1x1`, `static-9x16`, `video-9x16`, `carousel` — the canvas keys from `canvases.md`. Name the **primary** asset; use `static-4x5` when `feed-4x5` + `vertical-9x16` are paired (the normal case) |
| `hook` | 1–3 kebab words summarizing the hook (`sin-agentes`, `100pct-cartera`) |
| `v<n>` | minor copy variant |

Example: `r1_angle-pain_fmt-static-4x5_hook-no-alcanza_v1`

## Creative (library name) and asset files

- Creative `name`: same as the ad name.
- Asset copy: `data/ads/assets/<brand-lower>/<ad_name>__<canvas>.<ext>`, one file per canvas,
  storing the **JPEG that was uploaded** (`canvases.md` → Export)
  e.g. `…/<brand>/r1_angle-pain_fmt-static-4x5_hook-no-alcanza_v1__feed-4x5.jpg`

## Tracker id

`creatives.jsonl` `id` = `<brand-lower>-<YYYY-MM-DD created>-<ad_name>`.
`campaigns.jsonl` `id` = `<brand-lower>-<campaign_name>`.

## Legacy / hand-made names

Ads created before this convention (or in Ads Manager) use `BRAND | Theme | vN`, e.g.
`MICOBRO | Receipts | v1`, campaign `MIKRO | Loans | Financial category DR`. `review` accepts
these when backfilling: `brand` from the first segment, the middle segment kept as
`tags.hook_text`/`visual_style` hint, `vN` as the variant. Tags it can't infer stay `null`.
Older records also use the 1080-era preset keys in `fmt` and in filenames (`static45`,
`story916`, `feed45`, `square`, `link191`, `video916`). `review` reads them and maps them to
the canvas keys (`canvases.md` → Legacy preset keys); it does not rewrite them.

New ads always use the grammar above; don't rename live ads or existing asset files (renaming
is harmless to delivery but breaks the join with any existing tracker record unless you update
it too).
