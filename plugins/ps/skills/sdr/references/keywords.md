# signal-scan seed keywords

Organized **by segment** (offer/market), not one flat list — a single shared list got
noisy fast once we had more than one vertical to prospect. Add a new `## Segment: ...`
block per offer rather than growing an existing one. See `SKILL.md`'s "Search mechanics
learned from real-world testing" for the query-construction rules these lists assume
(simple queries, no nested booleans, location filter applied per-query).

## Segment: DR microfinance & collections (QCobro)

Validated 2026-07-28 via live LinkedIn testing (see conversation history / commit log for
the session). The `people` pass — title + sector term, e.g. `"Gerente General"
cooperativa` — dramatically outperformed generic keyword search for this segment.

### Executive/decision-maker titles (for the `people` pass)
- Gerente General
- Presidente
- Director Ejecutivo
- CEO
- Fundador / Fundadora
- Vicepresidente

### Sector terms
Pair **one** of these with **one** title above per query — don't combine multiple sector
terms in a single query (see the boolean-query lesson in `SKILL.md`).

Confirmed to return real DR results:
- cooperativa de ahorro y credito
- cooperativa (broad — expect noise; pair with the exclusion patterns below)
- financiera (very broad — 363 untargeted DR company-search results; only usable narrowed
  by Industry=Financial Services + a small company-size filter, and even then still noisy)

Confirmed **empty or unreliable** as of 2026-07-28 — don't reuse without retesting:
- microfinanciera (0 DR company-search results)
- microcrédito / microcredito (0 DR results, with or without the accent)

### Known real accounts (seed target list, found 2026-07-28)
- **COOPIBERICA** — Cooperativa de ahorro, crédito y servicios múltiples Iberoamericana
  (Santiago de los Caballeros) — small, on-thesis
- **COOPPAIS** — Cooperativa de Ahorro, Credito y Servicios Multiples PAIS (Santo Domingo)
  — small, on-thesis
- **Banco Adopem** (Santo Domingo, 1K-5K employees, verified) — microfinance/PYME-loan
  focused, women-founded heritage — strong fit despite being a larger regulated bank
- Banco Santa Cruz RD, Asociación Popular de Ahorros y Préstamos (APAP), Banco BHD —
  surfaced via LinkedIn's "related pages," but these are large mainstream banks;
  **verify fit manually** before treating as ICP, likely too big/general

### Exclusion patterns (set `org_fit: likely_exclude`)
"Cooperativa" is a broad legal structure in the DR that also covers employer-affiliated
employee savings coops with no outward-facing lending business — not the ICP. Flag orgs
whose name matches:
- Single-employer/industry employee coops: "de los Cerveceros" (brewery), "Servicios
  Eléctricos"/"eléctrica" (electric utility), and similar patterns
- Anything without its own public loan/credit product — check the "About" section if
  unsure before ruling it out

## Segment: Voice AI infra / KARMA / consulting (generic, lower priority)

**First draft — not yet validated the way the QCobro segment above is.** Inferred from
the public `/ps:post` brand pillars (Fonoster/Routr, KARMA, Voice AI consulting), not from
a real prospecting run. A real test (2026-07-26) showed the `keywords` pass on generic
industry terms mostly surfaces vendor content marketing and paid partnerships, not
prospects — treat this segment's terms the same way until proven otherwise, and prefer
building out a `people`-pass query list (title + sector) for it before relying on
`keywords`.

### Pain-point / topic phrases (keyword pass)

Voice AI infra / telephony:
- "voice agent latency"
- "IVR replacement"
- "Twilio alternative"
- "SIP trunking issues"
- "open source telephony"
- "CPaaS vendor lock-in"
- "programmable voice"

Contact center / CX:
- "contact center AI"
- "voice AI collections"
- "call center automation"

Voice AI quality / eval (KARMA angle):
- "voice agent hallucination"
- "voice AI evaluation"
- "STT TTS pipeline"
- "conversational AI QA"
- "voice agent benchmark"

### Buyer titles (job-change / people pass)

- VP Engineering / Head of Engineering
- CTO / Co-founder (early-stage voice AI or telephony startups)
- Head of AI / Director of AI
- Head of Customer Experience / Director of Contact Center Ops
- Voice Platform Engineer / Telephony Engineer

## How to tune this

- Prefer the `people` pass (title + sector term) over `keywords` for any segment — it
  was the single biggest quality improvement found in testing so far.
- If a query returns 0 results or is dominated by noise after a run or two, move it to
  that segment's "confirmed empty/unreliable" list rather than silently dropping it — the
  negative result is worth keeping so it isn't retried blind.
- Add real target company names as they're found, so `signal-scan` can be pointed at
  specific companies' People tabs instead of only open search.
- Keep exclusion patterns per-segment — what counts as noise is segment-specific (a
  brewery employee coop is noise for QCobro, but might be a fine ICP for a totally
  different offer).
