---
description: Ask the owner a question inside the note where the answer belongs, as a [!question] callout with clickable options, and read the [!decision] it becomes on the next run. Never resolve a question yourself.
mode: agent
---

# Open questions: ask the owner inside the notes

You are working in a vault of specs, plans and boards that a person reads in Obsidian. When you
hit a decision that is theirs to make, do not stop and do not guess silently: leave a
**question block** where the answer belongs and keep working on everything that does not
depend on it. The person answers by clicking (Keel Open Questions plugin) or by ticking a box.
The block becomes a **decision block**; the decision is also appended to a decision log. You
read it on your next run.

## When to ask

Ask when different answers would lead to materially different work, and the choice is about
taste, scope, money, naming, policy or a fact only the owner knows. Do not ask about things
the code, the docs or a sensible default can settle: decide those yourself and say so in the
decision log or a commit message.

One question per decision. Put it in the note that the answer changes (the spec, the plan,
the ADR), not in a chat message and not in a separate file. Prefer questions the owner can
answer with one click.

## How to write one

```markdown
> [!question] Q-3 Which brand prefix for plugin ids?
> Ids cannot contain "obsidian". The prefix is the marketing hook back to the suite.
> - [ ] keel — the tool the plugins light up for
> - [ ] pangolin — the suite name
> - [ ] none — neutral names
> asked: 2026-09-07 · by: claude · pick: one · log: INDEX.md#decision-log
```

- **Id.** `Q-N`, sequential per file: the highest N already in that file (question or
  decision blocks) plus one. Never reuse or renumber. The global key is `<vault path>#Q-N`.
- **Title.** The question itself, phrased so each option answers it. Short.
- **Context.** One to three lines: why it matters, what each choice implies. Optional.
- **Options.** Task-list items. Two to five, each a noun phrase, then ` — ` (a spaced em
  dash) and a one-line rationale. Put your recommendation first. **Never add an "Other…"
  option**; the plugin adds it.
- **Meta line.** `asked: <YYYY-MM-DD> · by: <your agent name>`, then `pick: one` (default)
  or `pick: many`, then `log:` if the default target is wrong. Optional `blocks: KB-3, KQ-1`
  naming the cards that wait on the answer.
- **Log target.** Default is the nearest `INDEX.md` above the note with a `## Decision log`
  heading, then `DECISIONS.md` at the workspace root. Set `log:` (relative to the note,
  optional `#heading`) only when that is not where the decision belongs.

## Never resolve a question yourself

Do not tick a box, rewrite a `[!question]` into a `[!decision]`, or write the log line for a
question you or another agent asked. That is the person's move. If you find a question with a
ticked box (`- [x]`) that has not been rewritten, that **is** an answer: apply the rewrite
below and append the log line, and treat the decision as made. If you must proceed before an
answer exists, state your assumption in the work itself and leave the question standing.

## Decision block and log line (what an answer looks like)

```markdown
> [!decision] Q-3 Which brand prefix for plugin ids?
> **keel** — the tool the plugins light up for
> asked: 2026-09-07 · by: claude · decided: 2026-09-07 · by: Johannes
> note: repos stay `obsidian-<name>`
```

Chosen option(s) in bold with their rationale, unchosen options dropped, context kept, both
dates, an optional `note:`. The log line appended under the log target's heading:

```markdown
- **2026-09-07** — Q-3 Which brand prefix for plugin ids? → **keel**. **Why:** the tool the plugins light up for. _(from `obsidian/specs/SPEC-integration.md`)_
```

Only when you rewrite a ticked question do you write these yourself; use the date you found
the tick and `by: owner` unless you know the person's name from the workspace.

## At session start: check for answers

1. Read the workspace's `.keel/context.md`. Note its `Updated:` date and the links under
   `## Open questions`.
2. Open each linked note. For every `[!decision]` block with a `decided:` date on or after
   that `Updated:` date, and every `[!question]` with a ticked box, act on the answer: unblock
   the cards it named in `blocks:`, apply the choice, mention it in your first update.
3. Remove answered items from `## Open questions`. Leave unanswered ones.
4. In a vault with the plugin, the command "Open questions: copy handoff" gives the same list
   for the current workspace; a person may paste it into your prompt.

## At session end: hand off what is still open

Under `## Open questions` in `.keel/context.md`, list every question you left that is still
unanswered, one line each, as a markdown link to the note followed by who asked, when, the
options and what it blocks:

```markdown
## Open questions

- [Q-3 Which brand prefix for plugin ids?](specs/SPEC-integration.md) · asked 2026-09-07 by claude · options: keel | pangolin | none · blocks: KB-3
```

Write `- _none_` when there is nothing open. Then bump `Updated:`. Other sessions run in
parallel: re-read the file before editing it and touch only your own lines.

## Do not

- Do not ask in chat what you could ask in the note.
- Do not add an "Other…" option, a deadline, or a default that answers the question for them.
- Do not edit or delete someone else's question or decision block, except to apply a tick.
- Do not use `[!question]` without a `Q-N` id for these; a bare question callout is just a
  callout and nothing renders or tracks it.
