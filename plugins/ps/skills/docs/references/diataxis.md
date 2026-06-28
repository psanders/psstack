# Diátaxis — the four documentation types

Every page is **exactly one** of these. The type is chosen in stage 0 and dictates the
page's spine, its voice, and which Mintlify components belong on it. If a topic seems to
need two types, it is two pages.

The four types split on two axes: **practical vs theoretical** and **study vs work**.

```
              PRACTICAL                 THEORETICAL
  STUDY   │  Tutorial               │  Explanation
  (learn) │  "teach me by doing"    │  "help me understand"
  ────────┼─────────────────────────┼──────────────────────
  WORK    │  How-to guide           │  Reference
  (do)    │  "help me do a task"    │  "tell me the details"
```

A quick test when unsure: *Is the reader learning or working?* *Do they want the steps or
the concepts?* The answer lands you in one quadrant.

---

## Tutorial — learning-oriented

A hand-held lesson that takes a beginner from nothing to a first success. The author is a
teacher; the reader is a student who does not yet know what questions to ask.

- **Promise:** "Follow these steps and you'll have a working X."
- **Rules:** one happy path, no choices, no alternatives, no theory dumps. Everything the
  reader types must work. Show concrete results after each step. Defer the *why*.
- **Spine:**
  1. What you'll build / what you'll have at the end (one or two sentences)
  2. Prerequisites (exact versions, accounts)
  3. Numbered steps, each: a context sentence → a command/code → the expected result
  4. A "you did it" confirmation + one or two next links
- **Mintlify:** `<Steps>`/`<Step>` for the arc, `<Check>` for "now you have X", `<Note>`
  for "keep this running", code blocks with expected output shown after.

## How-to guide — task-oriented

A recipe for a reader who already knows the basics and has a specific goal right now.

- **Promise:** "Here's how to accomplish <task>."
- **Rules:** title is a real task starting with a verb ("Create a campaign", "Configure
  webhooks"). Assume competence — don't re-teach basics. Stay on the one task; link out
  for tangents. Real-world, not toy. May branch for genuine alternatives (Tabs).
- **Spine:**
  1. One-line goal + when you'd want this
  2. Prerequisites/assumptions (brief)
  3. The ordered steps to the outcome
  4. Verify it worked; common pitfalls / next steps
- **Mintlify:** `<Steps>`, `<Tabs>` for platform/variant branches, `<Warning>` for
  footguns, `<Accordion>` for optional detail, `<CodeGroup>` for the same call in several
  languages.

## Reference — information-oriented

A dry, authoritative description of how the machinery works. The reader is here to
look something up, not to be taught. Structured to mirror the code.

- **Promise:** "Here are the exact fields / params / behaviors."
- **Rules:** describe, don't instruct or persuade. Consistent structure throughout
  (every field/endpoint documented the same way). Accurate and complete over readable —
  this is the contract. Source it from the actual schema/types, never from memory.
- **Spine:**
  1. One-line what-this-is
  2. The reference body: tables or field lists, grouped logically
  3. Minimal examples that show shape, not narrative
- **Mintlify:** `<ParamField>` / `<ResponseField>` for fields, `<Expandable>` for nested
  objects, tables for enums/options, `<CodeGroup>` for request/response samples,
  `<RequestExample>`/`<ResponseExample>` for API endpoints.

## Explanation — understanding-oriented

A discussion that illuminates a topic, gives background, and explains *why*. The reader
wants to understand, not act right now.

- **Promise:** "Here's how to think about X and why it works this way."
- **Rules:** topic- and concept-driven, not step-driven. Room for context, trade-offs,
  history, and design rationale. Make connections; admit alternatives. Does **not** tell
  the reader to do anything — link to the how-to for that.
- **Spine:**
  1. The concept and why it matters
  2. How it works / the model (diagrams earn their place here)
  3. Trade-offs, alternatives, design decisions
  4. Links to the related tutorial / how-to / reference
- **Mintlify:** prose first, a diagram (see `assets.md`), `<CardGroup>` to branch to
  related pages, the occasional `<Note>` for an aside.

---

## Common smells

- A "how-to" that keeps stopping to explain concepts → split the concepts into an
  explanation page and link.
- A "tutorial" full of "you could also…" branches → it's really a how-to, or it's two
  pages.
- A "reference" with motivational prose → cut it; reference is dry by design.
- An "explanation" with numbered steps → those steps want to be a how-to.
