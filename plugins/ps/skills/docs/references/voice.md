# House voice — Fonoster documentation

Distilled from the live Fonoster docs (docs.fonoster.com). QCobro is a Fonoster project
and writes in the same voice. Reconcile against the live site if it has moved on.

## The voice in one breath

Second person, present tense, active, short. You are a knowledgeable colleague guiding the
reader through a task — friendly and encouraging, but precise and never padded. Inspire,
don't intimidate; assume moderate technical literacy without talking down.

## Rules

- **Second person.** Address the reader as "you". "You can build any type of voice
  application." Never "the user" or "one".
- **Present tense, imperative for steps.** "Create a new script and add the following
  code." Not "We will now create…" or "You should create…".
- **Active voice.** "Fonoster connects telephony to the internet." Not "telephony is
  connected by Fonoster."
- **Short sentences with rhythm.** Mostly short and punchy; an occasional longer
  explanatory sentence for variety. Read it aloud — if you run out of breath, split it.
- **Lead with the point.** First sentence of a section says what the section is about or
  what the reader will get. No throat-clearing ("In this section, we will discuss…").
- **Code is preceded by context.** One sentence saying what the snippet does, then the
  block: "Once you have Node.js installed, you can create a simple voice application by
  running the following commands:".
- **Define jargon once, lightly.** Assume competence; explain a term the first time it
  matters, then move on. Don't over-explain basics.
- **Section headings can be questions.** "What is QCobro?", "What can you build?" — direct
  questions work well for explanation/landing pages.
- **Encouraging, not breathless.** Reassure progress ("You're all set."), but keep
  marketing adjectives out of the docs. Save the pitch for the marketing site.

## Word choices

- Prefer "you can" over "it is possible to".
- Prefer "to" over "in order to".
- Prefer plain verbs: "use", "set", "run", "open" over "utilize", "configure the setting
  for", "execute".
- American spelling.
- Product and feature names in their exact casing (QCobro, Fonoster, Voz IA). Code
  identifiers in `code font`.
- QCobro is **multilingual** — never describe it as Spanish-only. UI strings shown in docs
  come from the i18n layer; don't hardcode a language as "the" default.

## Callout discipline (see also mintlify.md)

- `<Note>` — supplementary info the reader needs but that interrupts flow ("Keep the app
  running for the next steps.").
- `<Tip>` — a helpful alternative or shortcut ("Twilio is the example here; other SIP
  providers work too.").
- `<Warning>` — a real footgun with consequences.
- `<Check>` — confirm a milestone is reached.
- Don't stack callouts or use them for ordinary prose. If everything is highlighted,
  nothing is.

## Representative sentences (from the live docs)

> "Fonoster is an innovative Programmable Telecommunications Stack that allows businesses
> to connect telephony services with the Internet."

> "With Fonoster, you can build any type of voice application."

> "Most of Fonoster's use cases require an account, the Command-line interface, and a
> virtual phone number."

> "Voice applications in Fonoster require Node.js to run."

Match this register: declarative, second person, concrete, unhurried but tight.
