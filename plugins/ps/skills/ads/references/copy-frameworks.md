# Copy frameworks — angles, structures, limits, policy

Write variants that differ by **angle**, not by synonyms. Three rewordings of one message is
one test, not three.

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

## Field limits (what's visible before truncation)

| Field | Visible | Hard guidance |
| :--- | :--- | :--- |
| Primary text (`message`) | ~125 chars before "See more" | First line = the hook. Can run longer for AIDA. |
| Headline (`headline`) | ~40 chars | Benefit or offer, not the brand name. |
| Description (`description`) | ~30 chars | Often hidden; never put critical info here. |
| CTA button (`call_to_action_type`) | enum | Match the objective (below). |

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

- **Personal attributes:** never imply you know the viewer's situation ("¿Estás endeudado?",
  "Sabemos que debes…"). Speak to the business role instead.
- **Financial products & services:** ads *offering credit/loans* must declare the special ad
  category (targeting limits apply). B2B software for lenders usually doesn't, but copy that
  sounds like a loan offer can get flagged. Ask Pedro; if in doubt, declare it and keep broad
  targeting (which the strategy already prefers).
- No exaggerated guarantees ("recupera el 100% de tu cartera").
- No fake UI or sensational imagery.

## Variant set checklist (per campaign round)

- 3–5 variants, each with a different `angle` (round 1) or the same angle with a different
  `hook_text` / `format` (later rounds). Record `test_variable`.
- Each variant: `primary_text`, `headline`, `description`, `cta`, `language`, `framework`,
  `hook_type` (`question` · `stat` · `statement` · `contrast` · `quote` · `command`), `hook_text`.
- Read `learnings.md` first; if an angle has lost twice for this brand, don't re-run it without
  saying why.
