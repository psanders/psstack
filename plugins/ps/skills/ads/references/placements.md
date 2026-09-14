# Placements — sizes, safe zones, and asset checks

Advantage+ placements (the default) show the same ad in Feed, Stories, Reels, Explore,
Marketplace, and more. An asset designed only for Feed gets cropped or covered elsewhere. This
file encodes the presets to design at and the zones to keep clear.

> **Verify before designing.** Meta changes UI overlays. At the start of a `creative` run,
> call `ads_get_help_article` for current Stories/Reels safe-zone and aspect-ratio guidance.
> If it disagrees with the numbers below, use Meta's and tell Pedro this file needs an update.

## Presets (design at these; export PNG at 1×, these are already full-res)

| Preset key | Size (px) | Ratio | Where it shows | Use |
| :--- | :--- | :--- | :--- | :--- |
| `feed45` | 1080 × 1350 | 4:5 | FB/IG Feed, Explore, Marketplace | **Default static.** Takes the most feed real estate on mobile. |
| `square` | 1080 × 1080 | 1:1 | Feed, right column, carousel cards | Carousel cards; fallback. |
| `story916` | 1080 × 1920 | 9:16 | Stories, Reels, Status | Required for a clean vertical placement. |
| `link191` | 1200 × 628 | 1.91:1 | Right column, some link placements | Rarely needed; only if Pedro asks. |

**Minimum set per ad concept: `feed45` + `story916`.** Meta picks the right one per placement
when both are supplied (placement asset customization). If only one asset is possible, make it
`feed45` and keep all critical content inside the central 1080×1080 so a 1:1 crop survives.

## Safe zones for `story916` (1080 × 1920)

```
┌──────────────────────┐  0
│  TOP: profile, name, │
│  "Sponsored", close  │  ≈ 0–270 px   (~14%)   ← no text, no logo
├──────────────────────┤
│                      │
│    SAFE CONTENT      │  ≈ 270–1340 px          ← headline, product, logo, offer
│    AREA              │
│                      │
├──────────────────────┤
│  BOTTOM: caption,    │
│  CTA button, reply   │  ≈ 1340–1920 px (~30–35% on Reels; ~20% on Stories) ← no text
└──────────────────────┘  1920
Side margins: keep ≈ 65 px (6%) clear on left/right.
```

- Design to the **stricter Reels bottom (~35%)** so one asset works for both Stories and Reels.
- Background imagery can bleed into unsafe zones; **text, logos, faces, UI screenshots, and the
  offer cannot.**

## Safe zones for `feed45` (1080 × 1350)

- Keep text ≥ 54 px (5%) from every edge.
- Critical content inside the **central 1080 × 1080** so Meta's 1:1 crop (some placements)
  doesn't cut it.
- The CTA button and headline render **below** the image in Feed; don't duplicate a fake
  button in the image.

## Asset rules that affect delivery

- **Text-light.** Meta no longer hard-rejects >20% text, but heavy text images get less
  delivery. Aim for one headline (≤ ~7 words) + optional short sub-line. Put the rest in the
  primary text.
- **Legible on a phone.** Headline type ≥ ~60 px at 1080 wide; check contrast.
- **One idea per image.** The visual should carry the *angle* (pain/outcome/proof) at a glance.
- **No fake UI** (fake play buttons, fake notifications, fake close buttons) — policy rejection.
- **Brand mark small**, inside the safe area; not the hero unless it's an awareness ad.
- **People and real product UI** tend to outperform abstract graphics for B2B; record
  `has_person` / `has_product_ui` in the tracker so the brand's own data can confirm.
- **Video:** 9:16, ≤ 15 s for Stories/Reels, hook in the first 1–2 s, captions burned in
  (most watch muted), same safe zones.

## Self-check before export (every frame)

1. Frame size matches a preset exactly.
2. All text/logo/offer inside the safe area (guide layer on in Pencil, then hidden for export).
3. Headline readable at 25% zoom (simulates a phone thumbnail).
4. Copy language matches the ad's `language`.
5. No policy red flags: before/after claims about personal finances, "you are in debt"
   personal-attribute phrasing, fake UI. (See `copy-frameworks.md` → policy.)
