# Strategy — how to run small-budget Meta campaigns that learn

This file is the judgment layer. The Meta Ads MCP can create anything; this decides **what**
to create, **how** to structure it, **when** to judge it, and **what to test next**. Tuned for
$5–20/day budgets (Pedro's starting range). Numbers below are working heuristics, not Meta
law: when `learnings.md` for the brand has enough data (n≥4 per cell), trust the brand's own
numbers over these defaults and say so.

## 1. Objective chooser

Pick the ODAX objective from what the business actually needs to happen next, not from what
sounds most ambitious.

| Pedro wants… | Objective | Optimize for (ad set `optimization_goal`) | Notes |
| :--- | :--- | :--- | :--- |
| Demo requests / form fills on the site | `OUTCOME_LEADS` | `OFFSITE_CONVERSIONS` on the Pixel `Lead` (or custom conversion) | Default for B2B SaaS like QCobro. Needs the Pixel event to actually fire. |
| Conversations on WhatsApp | `OUTCOME_LEADS` or `OUTCOME_ENGAGEMENT` | `CONVERSATIONS` + `destination_type: WHATSAPP` | Great in LatAm, lower friction than a form. Needs the Page linked to WhatsApp. |
| Instant lead form inside Meta | `OUTCOME_LEADS` | `LEAD_GENERATION` / `QUALITY_LEAD` | Cheapest leads, lowest quality. Page must accept leadgen ToS. |
| People on the landing page (no conversion volume yet) | `OUTCOME_TRAFFIC` | `LANDING_PAGE_VIEWS` | Use to warm a retargeting pool or when the conversion event can't hit volume. |
| Signups / purchases with value | `OUTCOME_SALES` | `OFFSITE_CONVERSIONS` / `VALUE` | Needs `promoted_object.pixel_id` + event. Rarely right under $20/day. |
| Name recognition in a new market | `OUTCOME_AWARENESS` | `REACH` | Only when there's a reason (launch, event). Don't use to "test creative". |

Never use Engagement (likes) to find customers: it optimizes for people who like things.

## 2. The learning-phase math (say this out loud during `new`)

Meta exits "learning" after roughly **50 optimization events per ad set in 7 days**. Before
that, delivery is unstable and costs look worse than they will be.

`events/week ≈ (daily_budget × 7) / expected_cost_per_event`

Example: $10/day with a $15 cost per lead → ~4.7 leads/week → **never exits learning**. That's
fine for learning *which creative wins*, but it means:

- Don't split the budget across multiple ad sets. **One campaign (CBO), one broad ad set, 3–5
  ads.** More ad sets = each starves.
- If the real goal event is far too expensive (demo request, purchase), consider optimizing
  for a cheaper upstream event (landing-page view, `ViewContent`, a "started form" custom
  event) for the first test, then move down-funnel once winners are known. Tell Pedro the
  trade: cheaper event = more signal, but Meta finds clickers, not necessarily buyers.
- "Learning limited" is expected at this budget. It is not a failure by itself.

## 3. Account structure at $5–20/day

```
Campaign  (CBO, daily budget, one objective)
└── Ad set  (broad: country/city + language; Advantage+ audience ON; Advantage+ placements)
    ├── Ad A  angle 1
    ├── Ad B  angle 2
    ├── Ad C  angle 3
    └── (Ad D/E optional — format or hook variant of the strongest angle)
```

- **Broad targeting.** Meta's delivery system now uses the creative itself to find the
  audience. Tight interest stacks usually raise CPM and cut volume. Only add interests Pedro
  explicitly provides with real IDs; never invent IDs.
- **Advantage+ placements** by default (so assets must survive every placement — see
  `canvases.md`).
- **Retargeting** (site visitors, video viewers) only once there's a pool of ~1,000+ people;
  not in the first campaign.
- **Budget ≥ 3× expected cost per result per day** is the comfort zone. Below that, results
  are lumpy; judge on longer windows.

## 4. The creative-testing ladder

Creative is the main lever. Test the biggest idea first, the smallest detail last, and change
**one variable** per round so the result means something.

1. **Angle** — *what* we say (pain / outcome / proof / objection-kill / contrast). Biggest swing.
2. **Format** — static vs short video vs carousel, 4:5 vs 9:16.
3. **Hook** — the first line / first 3 seconds / headline on the image.
4. **Body copy & CTA** — smallest swing; test last.

Round 1 for a new brand: 3 ads = 3 different angles, same format. Round 2: take the winning
angle, test 2–3 formats or hooks. Record `test_variable` and `parent_id` in the tracker so the
lineage is legible later.

## 5. When to judge (the no-touch rule)

- **Don't edit an ad set for 3–7 days after launch** (budget, targeting, adding/removing ads
  restarts learning). Pausing an obviously broken ad is fine.
- **Minimum evidence before any verdict:** ~72h live **and** ~1,000 impressions per ad **or**
  spend ≥ 1× target cost per result. Below that → `inconclusive`, keep running.
- CBO will starve some ads (few impressions). That *is* a signal — Meta predicts they'll lose
  — but an ad with <500 impressions after 7 days is `inconclusive`, not `loser`. Re-test the
  idea in a fresh round if the angle matters.

## 6. Kill / keep / scale / iterate

Set a **target cost per result** during `new` (ask Pedro what a lead/demo is worth; if unknown
use the industry benchmark from `ads_insights_industry_benchmark` and label it as such).

| Condition (after minimum evidence) | Action | Tracker verdict |
| :--- | :--- | :--- |
| Spend ≥ 2× target CPR with **0 results** | Kill (pause) | `loser` |
| CPR > 1.5× target after 7 days | Kill | `loser` |
| Link CTR < ~0.8% (feed) after 1,000+ impressions and no results | Kill — the hook isn't landing | `loser` |
| CPR ≤ target, stable for 3+ days | Keep; make it the parent of the next test | `winner` |
| CPR ≤ 0.7× target and frequency < 2 | Scale budget **+20% max**, every 3–4 days | `winner` |
| Was a winner; CPR rising ≥ 30% over 7 days **and** frequency > ~3 | Refresh: new hook/visual on the same angle | `fatigued` |
| Good CTR, poor conversion rate | Problem is the landing page / offer, not the ad. Say so. | keep verdict, note it |
| Not enough evidence | Keep running | `inconclusive` |

Scaling rules: never double a budget overnight; don't scale during learning; if a scale step
pushes CPR up >25%, step back.

## 7. Diagnosis tree

Walk top-down; stop at the first match.

1. **Not spending / tiny impressions** → budget too small for the auction, audience too
   narrow, ad rejected, or payment issue. Check `ads_get_errors` / delivery status first.
2. **High CPM** (well above the brand's baseline or benchmark) → audience too narrow, low
   creative quality ranking, or competitive season. Broaden; refresh creative.
3. **Low CTR** → hook/visual problem. Test new hooks on the same angle, or a new angle.
4. **Good CTR, low conversion rate** → landing page, offer, form friction, or mismatch
   between ad promise and page. Don't keep killing ads for a page problem.
5. **Good conversion, bad lead quality** (Pedro reports junk leads) → move optimization
   down-funnel (`QUALITY_LEAD`, a qualified-lead custom conversion), add a qualifying line to
   the copy ("para cooperativas y financieras con cartera en mora"), or add friction.
6. **Rising CPR on a former winner + frequency > 3** → fatigue. Refresh.

## 8. The next test (always end `review` with one)

Every `review` ends with exactly one proposed next round:

- Which ad is the **parent** (current best).
- Which **one variable** changes (from the ladder), and why (the diagnosis).
- 2–3 concrete new variants (copy + visual direction), named per `naming.md`.

If there's no winner yet after two full rounds of angles, question the offer or the landing
page before generating a third round of creatives.
