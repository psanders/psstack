# Guardrails — limits, policy, defaults, craft, checklist

The rules an ad must pass before it is created in Meta, **even as PAUSED**. Geometry and export
live in `canvases.md`; angles and structures in `copy-frameworks.md`. Brand-specific rules
(approved claims, voice, forbidden words, the ad palette) live in the brand's own repo, not
here — this file is brand-agnostic.

## 1. Copy lengths: write to the strictest placement

With Advantage+ placements one piece of copy is shown everywhere, so write to the tightest
limit and let roomier placements show more. These are Meta's recommended **visible** lengths,
not hard caps — the field will accept more and then truncate it where it matters.

| Field | Hard target | Why (tightest placements) |
| :--- | :--- | :--- |
| Primary text: **first line** | **≤ 40 characters**, and it must work alone | FB Reels 40, IG Reels 44 |
| Primary text: total | ≤ 125 characters | Stories, IG Feed, Search, Marketplace, Audience Network |
| Headline | **≤ 27 characters** | FB Feed and Business Explore |
| Headline, carousel card | ≤ 20 characters | FB Feed / Messenger Stories carousel |
| Description | ≤ 18 characters, or omit | FB Feed carousel; often hidden entirely |
| On-image headline | ≤ 7 words | Legibility at phone size |
| Reels overlay headline | ≤ 10 characters | Only if the Reels overlay placement is kept on |

## 2. Policy

| Rule | How to apply |
| :--- | :--- |
| **Never assert or imply a personal attribute of the viewer**, including financial status. Questions count ("Are you in debt?"). "You" is fine when no attribute is implied. | Call-outs name a **business role** ("for lending teams"), never a condition of the person. |
| **No private information** — PII, contact, financial, residential or medical — in copy, images, UI screenshots or audio. | Anonymize every screenshot and recording: names, amounts, phone numbers, IDs, addresses. |
| **Special ad category** is decided per campaign by the business owner, and recorded with its reasoning. | Credit/financial products & services is *required* for US audiences (credit also CA and listed EU countries). B2B-only offers are excluded. If "None", keep geo out of those regions and keep every ad unmistakably B2B. |
| **Facts only.** Every number or claim traces to a source the owner approved. | No invented metrics, no implied guarantees, no before/after financial claims. |
| **No fake UI.** | See `canvases.md` → Global rules. |
| **IG Reels:** no licensed music, no face/camera effects, no GIFs, no product tags. | Use original audio. |

## 3. AI disclosure

Ask the owner before creating each creative (`self_ai_disclosure` on `ads_create_creative`; it
**cannot be changed afterwards**). Default to **disclose** when the asset contains any of:

- A **photorealistic AI-generated image** (a generated portrait or scene).
- **Realistic AI-generated audio**, including a synthetic voice heard in a recording.
- A person or event depicted as real that isn't.

Not AI for this purpose: stock photos, real screenshots, real recordings of humans, color
correction, crops.

This is deliberately stricter than Meta's published minimum, which covers political and
social-issue ads; Meta also detects AI media automatically.

**The Ads Manager UI has no AI-disclosure field for non-political ads** — only the API carries
`self_ai_disclosure` (it applies in the EU, India, Taiwan, California and New York). So an ad
built through the UI (§4, and the UI build path in `publishing.md`) can't carry the flag. If
the audience includes those regions and the asset needs disclosure, build that ad through the
API instead, or re-check whether Meta has added the field.

## 4. Advantage+ creative enhancements

Meta turns most of these **on by default**, in several different panels, and some can only be
switched off in one of them. Review every panel for every ad.

### Defaults for this framework (API and UI)

| Enhancement | Default | Reason |
| :--- | :--- | :--- |
| Enhance media text / text improvements (AI rewrites on-image text) | **Off** | Rewords claims; breaks facts-only |
| Add overlays (AI) | **Off** | Uncontrolled text position lands in unsafe zones |
| Image generation (AI variations, generated text and logos) | **Off** | Off-brand; invents visuals |
| Add animation (AI; animates text) | **Off** for any image with text | Moves text into unsafe zones |
| Enhance CTA (can add promo text like "x% off") | **Off** | Invented offers |
| Artistic filters, varying aspect ratio, feed templates | **Off** | Crops through safe zones; off-brand |
| Music (including AI music) | **Off** when the ad has its own audio; otherwise the owner's call | Would play over real audio |
| Video effects (AI contrast/saturation) | **Off** | Brand color fidelity |
| Sticker CTAs | **Off** | Covers content |
| Flexible media | **Off** for video with text; on for images only if every canvas was supplied | Meta can't detect cropped text in video |
| Brightness and contrast | Off (low risk; allowed if the owner opts in) | Brand color fidelity |
| Carousel: best card first / cards as video | Off when card order tells a story; on otherwise | Each card should stand alone anyway |
| Optimize text per person | On **only** if every text variant is approved | Mixes variants freely |

### Hidden UI defaults checklist (when building in Ads Manager)

A new ad built in the UI arrives with all of these already on, spread across four places.
Walk all four; a single "Enhancements" tab is not the whole set.

| Where | What's on by default |
| :--- | :--- |
| Creative setup → extensions/add-ons | Website highlights, Show spotlights, Relevant comments |
| Enhancements step (walk **every tab**, not just the first) | Visual touch-ups, Brightness/contrast, Add music, Add animation, Text improvements, Add overlays, Adapt multi-image |
| Review-defaults panel before publishing (the summary that lists what's enabled) | Flexible media, and anything re-enabled by a later edit |
| Format section | **Multi-advertiser ads** — a separate checkbox next to the format choice, not in the enhancements step |

Also:

- **Duplicating an ad re-checks "add music to Reels"** even when the source ad had it off.
  Re-check the duplicate, every time.
- Switching an enhancement off can raise a **"keep using" confirm dialog** that pushes back;
  confirm the off state after dismissing it.
- **Verify visually.** The accessibility tree has reported toggle states that didn't match what
  the page showed. Read the rendered control, don't trust the label.

## 5. Pre-publish checklist (every ad)

**Assets**

- [ ] Each export is exactly its canvas size (`sips`), JPEG without alpha, exported at 1×.
- [ ] `feed-4x5` **and** `vertical-9x16` exist for the idea (the minimum set).
- [ ] **Safe zone, part 1 — scripted:** dump the bounds of every text, icon and pill node and
      check them against the canvas rule (4:5 → central 1:1, y 180–1620; 9:16 → y 358–1664;
      sides 86 everywhere). A wordmark one pixel outside the 1:1 crop is a real failure.
- [ ] **Safe zone, part 2 — visual:** read back the guide-visible export and confirm that faces
      and key subjects *inside photos* clear the bands. A script sees nodes, not a chin sitting
      in the bottom 35%. Both parts are mandatory; neither substitutes for the other.
- [ ] Headline readable at 25% zoom (simulates a phone thumbnail).
- [ ] No fake UI; no on-image text at all on a `thumb-1x1-notext` asset.
- [ ] Screenshots and audio fully anonymized.
- [ ] Headline and image are congruent (§6).
- [ ] Every color is a brand token (§6).
- [ ] Video: ≤ 15 s, captions burned in, hook in 0–2 s, no licensed music.

**Copy**

- [ ] Primary text first line ≤ 40 characters and self-sufficient; total ≤ 125.
- [ ] Headline ≤ 27 characters; description ≤ 18 or omitted.
- [ ] Language matches the ad's language; one language per ad.
- [ ] Call-out names a business role; no personal attribute, including as a question.
- [ ] Every number or claim is on the brand's approved list.

**Setup**

- [ ] Account readiness passed (SKILL.md → Account readiness), including billing country,
      currency and time zone.
- [ ] Message match confirmed: the landing page offers what the ad promises, and the
      conversion event fires there.
- [ ] Special ad category chosen by the owner, reasoning recorded; geo consistent with it.
- [ ] AI disclosure answered per §3.
- [ ] Enhancements set per §4 — checked in **all four** UI places, or set explicitly via the API.
- [ ] Placement asset customization: 4:5 on feeds, 9:16 on Stories/Reels/Status.
- [ ] `ads_get_ad_preview` reviewed on the PAUSED ad. Meta's overlay geometry isn't published;
      the preview is the only real check.
- [ ] Everything created PAUSED; going live needs an explicit owner "yes" for that action.

## 6. Creative craft

Three failure modes that pass every limit above and still produce a bad ad.

### Headline × image congruence

The headline makes a claim *about the picture it sits on*. Check the pair, not each half.

- An **automation or AI claim** needs an image with **no person**, or a clearly artificial
  avatar. "Automated X with AI voice" over a photo of a human implies that human is the AI.
- A **photo of a real person** takes **augmentation** copy — the team, now with the tool —
  not replacement copy.
- Product UI carries proof claims; type-only carries category and offer claims.

### AI imagery prompts

Generated people and places fail in predictable ways. Prompt against them:

- **Candid, not posed.** Ask for a moment mid-work, imperfect framing, film grain. "Smiling at
  camera" reads as stock and gets rejected on sight.
- **Name the setting explicitly**, with its furniture. A generic "office" drifts into whatever
  the model finds typical for the region; "a lending office: service counter with a glass
  partition, filing cabinets, a desk phone" does not.
- **List forbidden background items.** Calendars and visible dates, religious imagery, readable
  third-party logos, products on shelves, text of any kind. Enumerate them in the prompt; they
  will otherwise appear.
- **Check props for logic.** A person cannot use a headset and hold a phone to their ear at the
  same time. Two mice, three hands, a screen showing a different app than the copy claims — all
  common, all disqualifying.
- **Place the face deliberately.** Say which vertical band the face occupies, so it lands
  inside the content box and not in the 9:16 bottom band.

### Brand-token palette

The ad palette is **derived from the site's design tokens**, so an ad and the page it opens
feel like one brand. Define it once in the brand layer (a dark mood and a light mood, each with
background, text, and one highlight/pill color) and use nothing else.

- **Off-palette color is forbidden** in layouts *and* in generated-art prompts. Loud ad colors
  (lime, neon, gold) test well in isolation and break the hand-off to the landing page.
- Name the palette colors inside the art prompt. Art generated "in brand colors" without the
  actual values comes back off-brand.
- If the site's tokens change, the ad tokens change with them — never the other way round.

## 7. Keeping this current

Meta changes specs without notice. Re-verify when:

- A review shows an unexplained delivery drop on one placement.
- `ads_get_ad_preview` shows text covered by UI.
- The numbers here are more than 6 months old.

Fix this file and the brand's `Guide/*` components together. Never tune a single ad around a
spec change.
