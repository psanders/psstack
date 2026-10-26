# Writing titles

A title is read in lists, notifications, changelogs and release notes, often without the
body. It must say what changes for whoever reads it, on its own.

## PR titles

The PR title follows Conventional Commits: `type(scope): outcome`. It usually matches the
main commit, and release notes are built from it.

**Do**

- **State the outcome in behavior, not the work.** What is true after the merge that wasn't
  before. `fix(edgeport): negotiate the sip subprotocol whatever the case of the header names`
- **Name the scope** as the package or area that changes: `fix(ctl): …`, `ci(release): …`.
- **Use the imperative or present tense, lowercase after the colon, no period.**
- **Mark breaking changes with `!`:** `feat(connect)!: refuse to start with two verifiers set`.
  It must agree with the Brief's Breaking change line.
- **Use the words users see:** the CLI command, the env var, the error, the screen.
- **Keep it under about 72 characters.** If it needs more, the PR does too much; split it.

**Don't**

- Describe the process: `fix bug`, `address review`, `updates`, `wip`, `final changes`.
- Restate the issue as a problem: `connect startup check is wrong`. Say what the fix does.
- Put the issue number or ticket id in the title; `Closes #n` goes in the body.
- Use `[WIP]` or `[DRAFT]`; open a draft PR instead.
- Join two changes with "and"; that's two PRs.
- Use vague verbs on their own: `improve`, `refactor`, `update`, `handle`, `support` need an
  object that says what got better.
- Use internal jargon a release-notes reader wouldn't know.

| Instead of | Write |
| :--- | :--- |
| `Fix Connect bug (#437)` | `fix(connect): check CONNECT_VERIFIER_PUBLIC_KEY_PATH in the one-verifier startup assertion` |
| `Update trunk prompts` | `fix(ctl): trunk prompts ask for the Port, not the Post` |
| `[WIP] telemetry` | `feat(telemetry): traces, metrics and logs over OTLP from EdgePort and every service` |
| `Address review comments` | (no new PR; push to the same branch) |

## Issue titles

**Do**

- Write the Problem line, shortened: who hits what. `EdgePort drops the BYE to WebRTC clients
  over WSS`
- Use plain words a user would search for.

**Don't**

- Add a type prefix (`[BUG]`, `feat:`); the issue type carries the kind.
- Write the solution as the title of a bug; the title says what's wrong, the Spec says what
  to do.
- Write a question or a topic (`Thoughts on recording?`, `Telemetry`). If it's a question,
  it belongs in a Discussion.
