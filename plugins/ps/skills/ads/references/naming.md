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
| `fmt` | `static45`, `static11`, `story916`, `video916`, `carousel` (use the primary asset; `static45` when feed45+story916 are paired) |
| `hook` | 1–3 kebab words summarizing the hook (`sin-agentes`, `100pct-cartera`) |
| `v<n>` | minor copy variant |

Example: `r1_angle-pain_fmt-static45_hook-no-alcanza_v1`

## Creative (library name) and asset files

- Creative `name`: same as the ad name.
- Asset copy: `data/ads/assets/<brand-lower>/<ad_name>__<preset>.<ext>`
  e.g. `data/ads/assets/qcobro/r1_angle-pain_fmt-static45_hook-no-alcanza_v1__feed45.png`

## Tracker id

`creatives.jsonl` `id` = `<brand-lower>-<YYYY-MM-DD created>-<ad_name>`.
`campaigns.jsonl` `id` = `<brand-lower>-<campaign_name>`.
