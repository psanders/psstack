# Research behind the process

Collected 2026-10-26 so nobody has to redo it. Each row is a finding, its source, and what the
process does because of it. Re-check a source before leaning on it for a new decision.

## Issue format

| Finding | Source | What we do |
| :--- | :--- | :--- |
| An ideal agent task has a clear problem, complete acceptance criteria and pointers to the files to change. Treat the issue as a prompt. Keep ambiguous, broad and production-critical work for humans. | [GitHub: get the best results from Copilot cloud agent](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results) | Problem, acceptance criteria and Where to look are required. |
| Across 32 quality criteria, issues whose agent PRs merged were shorter, tightly scoped, pointed at the relevant artifacts and said how to implement. Issues depending on external config, setup or APIs merged less. | [Sayagh 2025, arXiv 2512.21426](https://arxiv.org/abs/2512.21426v1) | Size S or M only; inline external context. |
| Give the agent a check it can run. The best specs are self-contained, name files and interfaces, state what is out of scope, and end with an end-to-end verification step. | [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | Verify command; Out of scope never empty. |
| Summary first; Goals and Non-Goals; Risks and Mitigations required; upgrade and version skew explicit. | [Kubernetes KEP template](https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/README.md) | Breaking change and Risk sit in the Brief. |
| One-paragraph summary first; unresolved questions live in the RFC, not the work. | [Rust RFC template](https://github.com/rust-lang/rfcs/blob/master/0000-template.md) | No open questions in an issue; decisions go to Discussions. |
| Every change is judged against the compatibility promise. | [Go proposal process](https://github.com/golang/proposal/blob/master/README.md) | Breaking change is a required yes/no. |
| Breaking changes are marked with `!` or a `BREAKING CHANGE:` footer. | [Conventional Commits 1.0](https://www.conventionalcommits.org/en/v1.0.0/) | A Yes in the Brief maps to the commit marker. |
| Put the conclusion first (BLUF, from US Army AR 25-50). | [BLUF](https://en.wikipedia.org/wiki/BLUF_(communication)) | The Brief comes before the Spec. |
| OpenAI's annotators kept 500 of 1,699 sampled SWE-bench tasks; underspecified issue text was one of two discard reasons. | [OpenAI: SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) | The Implementer refuses unclear work. |

## Agents and roles

| Finding | Source | What we do |
| :--- | :--- | :--- |
| A persona in the system prompt didn't beat no persona across 162 roles and 2,410 questions. | [Zheng et al., EMNLP Findings 2024](https://arxiv.org/abs/2311.10054) | Experts are checklists, not titles. |
| Role-based agents work when each role carries a standard procedure and a fixed output format. | [MetaGPT, ICLR 2024](https://arxiv.org/abs/2308.00352) | Every expert has the same output contract. |
| Multi-agent setups use about 15x the tokens of a chat; coding parallelizes poorly; vague delegation duplicates work. A delegated task needs an objective, output format, tools and boundaries. | [Anthropic: multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | At most 4 experts per stage; briefs, not conversations. |
| Read-only helpers and a clean-context reviewer work; parallel agents writing code still fail. Keep writes single-threaded. | [Cognition 2026](https://cognition.com/blog/multi-agents-working), [Cognition 2025](https://cognition.com/blog/dont-build-multi-agents) | Experts never write; one writer per stage. |
| Start with the simplest thing; add agents only when they earn their cost. | [Anthropic: building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Build three experts first. |

## Advocate, critic and committee

| Finding | Source | What we do |
| :--- | :--- | :--- |
| Debate between agents helps reasoning, but debates often converge on a confident wrong answer. | [Du et al., ICML 2024](https://arxiv.org/abs/2305.14325) | A human weighs the advocate and the critic. |
| Sycophancy collapses disagreement early, sometimes below a single agent's accuracy. | [Yao et al. 2025](https://arxiv.org/abs/2509.23055) | Advocate and critic write blind to each other. |
| Imagining the project already failed raised people's ability to name reasons by 30% (Mitchell, Russo and Pennington, 1989). | [Klein, HBR 2007](https://hbr.org/2007/09/performing-a-project-premortem) | The critic runs as a premortem. |
| A panel of diverse judges beat one large judge, with less self-preference and 7x lower cost. | [Verga et al. 2024](https://arxiv.org/abs/2404.18796) | The Reviewer is a committee with clean context. |

## Platform

| Finding | Source | What we do |
| :--- | :--- | :--- |
| AGENTS.md is the cross-tool instruction file, stewarded by the Linux Foundation; Codex, Copilot, Cursor, Gemini CLI, Devin and others read it. | [agents.md](https://agents.md/) | Project facts live in AGENTS.md. |
| Claude Code reads AGENTS.md when no CLAUDE.md or CLAUDE.local.md exists; with one, it reads only CLAUDE.md. | [Claude Code memory docs](https://code.claude.com/docs/en/memory#agents-md) | Repos get no CLAUDE.md. |
| Issue forms can set the native issue type with `type:`. | [GitHub: issue form syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) | Types replace title prefixes. |
| An org's `.github` repo provides default templates, but a repo with any file in its own `.github/ISSUE_TEMPLATE` ignores them. | [GitHub: default community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) | Org-wide forms; repos delete their own. |
| Issue fields (single-select, text, number, date) are GA since 2026-07-02; forms can't set them yet. | [GitHub changelog](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available/), [docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization) | Labels first; fields later via an Action. |
| Issue dependencies ("blocked by") are GA since 2025-08-21. | [GitHub changelog](https://github.blog/changelog/2025-08-21-dependencies-on-issues/) | Slices link by dependency; no umbrella issues. |
| `pull_request_target` plus a checkout of the PR's code can expose secrets. | [GitHub Security Lab](https://securitylab.github.com/research/github-actions-preventing-pwn-requests) | Agents on outsider PRs get read-only tokens and no secrets. |
