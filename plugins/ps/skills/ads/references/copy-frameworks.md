# Copy frameworks — angles, structures, CTA, framing

Write variants that differ by **angle**, not by synonyms. Three rewordings of one message is
one test, not three.

**Awareness gates the angle.** An audience that doesn't know the category exists can't be sold
a differentiator or an offer — every ad has to open by saying what this *is*, in plain words,
before any angle plays. Ask the awareness question first (SKILL.md → Batch 4) and filter the
library with the answer: unaware → category-first first line on `pain`, `contrast` or `demo`;
category-aware → `outcome`, `proof`, `objection`; brand-aware → offer-led.

## Angle library

| Angle key | The idea | QCobro-style example (es) |
| :--- | :--- | :--- |
| `pain` | Name the costly problem the buyer lives with | "Tu equipo de cobranza no alcanza a llamar a toda la cartera en mora." |
| `outcome` | The after-state, concrete and measurable | "Contacta el 100% de tu cartera cada día, sin sumar agentes." |
| `proof` | Evidence: a number, a customer type, a result | "Cooperativas en RD ya recuperan más con llamadas de IA." |
| `objection` | Kill the #1 reason they won't act | "No reemplaza a tu equipo: le quita las llamadas repetitivas." |
| `contrast` | Old way vs new way | "Antes: 3 agentes, 200 llamadas. Ahora: IA, 5,000 llamadas." |
| `curiosity` | Open a loop worth closing | "Lo que tus mejores cobradores hacen distinto (y la IA copia)." |
| `demo` | Show the product doing the thing | "Escucha una llamada de cobranza real hecha por IA." |

Only use numbers/claims Pedro confirms are true. If a proof point isn't available, don't
invent one — switch angle.

## Structures

- **PAS** (Problem → Agitate → Solution): best for `pain`.
- **BAB** (Before → After → Bridge): best for `contrast` / `outcome`.
- **AIDA** (Attention → Interest → Desire → Action): longer primary text, good for `demo`.
- **One-liner**: hook + CTA only. Good control variant; surprisingly strong in Feed.

## Field limits

Lengths live in `guardrails.md` §1, written to the **strictest** placement rather than to the
field maximum — with Advantage+ placements one piece of copy runs everywhere, and Reels
truncate the first line at ~40 characters. Write to those numbers, not to what the field
accepts. In short: the first line has to work alone, the headline is a benefit or offer rather
than the brand name, and the description is usually hidden.

## CTA mapping

| Objective / destination | CTA |
| :--- | :--- |
| Demo request on site | `BOOK_A_CONSULTATION` or `GET_STARTED` (tone), `LEARN_MORE` (softest) |
| WhatsApp conversation | `WHATSAPP_MESSAGE` |
| Instant form | `SIGN_UP` / `GET_QUOTE` |
| Traffic to content | `LEARN_MORE` |
| Free trial | `SIGN_UP` |

## B2B framing (collections / lending buyers)

Buyers: Gerente General, Gerente de Cobranzas / Riesgo / Operaciones at cooperativas,
financieras, microfinance institutions, banks' collections units, BPOs (see sector vocabulary
in `../../sdr/references/keywords.md`).

- Speak to the **operator's** problem (capacity, contact rate, cost per recovered peso,
  compliance), not the debtor's.
- Qualify in the copy to cut junk leads: "Para cooperativas y financieras con más de 1,000
  préstamos activos."
- Regional language: DR/LatAm Spanish ("cartera", "mora", "gestión de cobro"). Ask per campaign;
  never assume English.

## Policy watch-outs (Meta)

Full rules in `guardrails.md` §2; two of them shape how a line gets written:

- **Personal attributes:** never imply you know the viewer's situation, not even as a question.
  Write to the business role instead. This is what makes the call-out a role, not a condition.
- **Financial products & services:** ads *offering* credit or loans must declare the special ad
  category. B2B software sold to lenders usually doesn't, but copy that reads like a loan offer
  gets flagged anyway. Pedro decides per campaign; the reasoning gets recorded.

No exaggerated guarantees, no fake UI, no sensational imagery.

**The headline is a claim about the image it sits on** — check the pair before writing the next
variant (`guardrails.md` §6).

## Variant set checklist (per campaign round)

- 3–5 variants, each with a different `angle` (round 1) or the same angle with a different
  `hook_text` / `format` (later rounds). Record `test_variable`.
- Each variant: `primary_text`, `headline`, `description`, `cta`, `language`, `framework`,
  `hook_type` (`question` · `stat` · `statement` · `contrast` · `quote` · `command`), `hook_text`.
- Read `learnings.md` first; if an angle has lost twice for this brand, don't re-run it without
  saying why.
