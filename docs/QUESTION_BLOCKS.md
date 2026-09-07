# Question blocks and decision blocks

The convention Keel Open Questions renders and edits. It is contract C2 of the keel Obsidian
plugins' integration spec; this repo owns it, and only a change here changes it. Other
plugins and agents copy `src/core/blocks.ts`; they do not redefine the format.

The idea: an agent writing a spec, plan or ADR leaves a question **where the answer belongs**.
The person answers by clicking (with the plugin) or ticking a box (without it). The block
becomes a decision, and the decision is appended to a decision log. **Agents never resolve a
question themselves.**

## Question block

A callout, so it renders acceptably in any Obsidian vault without the plugin:

```markdown
> [!question] Q-3 Which brand prefix for plugin ids?
> Ids cannot contain "obsidian". The prefix is the marketing hook back to the suite.
> - [ ] keel — the tool the plugins light up for
> - [ ] pangolin — the suite name
> - [ ] none — neutral names
> asked: 2026-09-07 · by: claude · pick: one · log: INDEX.md#decision-log
```

- **`Q-N`** — sequential per file, minted by the agent: the highest existing N in the file
  (over question *and* decision blocks) plus one. The global key is `<vault path>#Q-N`.
  A `[!question]` callout without a `Q-N` id is an ordinary callout and is left alone.
- **Title** — the rest of the header line: the question, phrased so the options answer it.
- **Context** — free lines between the title and the options. Optional.
- **Options** — task-list items. Text after ` — ` (spaced em dash) is the rationale. The
  plugin always adds an "Other…" free-text choice; **the agent must not add one**.
- **Meta line** — `key: value` pairs joined by ` · `:
  - `asked:` date, `by:` who asked (the agent's name).
  - `pick: one` (default) or `pick: many`.
  - `log:` where to append the decision, relative to the note, with an optional
    `#heading` anchor. Default: the nearest `INDEX.md` above the note (not above the
    workspace root) with a `## Decision log` heading, else `DECISIONS.md` at the workspace
    root if it exists, else nowhere (the block itself is the record). An explicit `log:`
    that names a missing file creates it.
  - `blocks:` optional, card ids that wait on this answer (`KB-3, KQ-1`). May also stand on
    its own line.
- **A ticked option (`- [x]`) is an answer.** People without the plugin answer this way.
  The plugin, or the next agent to read the file, performs the rewrite below and the log
  append; until then the tick stands. The plugin shows such a block with a "Record answer"
  button instead of the options.

## Decision block

What the question becomes on resolution:

```markdown
> [!decision] Q-3 Which brand prefix for plugin ids?
> **keel** — the tool the plugins light up for
> asked: 2026-09-07 · by: claude · decided: 2026-09-07 · by: Johannes
> note: repos stay `obsidian-<name>`
```

- The chosen option(s) come first, bold, with their rationale; unchosen options are dropped.
  A `pick: many` decision lists each chosen line. An "Other…" answer is the typed text, bold,
  with no rationale.
- Context lines from the question are kept, after the chosen lines.
- The meta line carries both dates: the `by:` after `asked:` is the asker, the `by:` after
  `decided:` is the decider. `blocks:` is kept; `log:` is dropped once the log line exists.
- `note:` is the free text typed on resolution. Omitted when empty.

## The log line

One line appended to the log target, under the anchored heading (at the end of that
section) or at the end of the file:

```markdown
- **2026-09-07** — Q-3 Which brand prefix for plugin ids? → **keel**. **Why:** the tool the plugins light up for. _(from `obsidian/specs/SPEC-integration.md`)_
```

The **Why** is the chosen rationale (several are joined with `; `), else the note, else the
clause is omitted. The path in parentheses is the note's vault path.

## Handoff between sessions

1. Any agent, at any time, may leave question blocks. Work that does not depend on the
   answer continues; work that does is carded with `blocks:` pointing at the question.
2. At **session end** the agent lists every unanswered question it left, as links, under
   `## Open questions` in the workspace's `.keel/context.md`.
3. At **session start** the agent scans for `[!decision]` blocks newer than the context
   file's `Updated:` date and acts on them, then removes answered items from
   `## Open questions`.
4. The plugin's **"Open questions: list"** shows every unanswered block in the current
   workspace; **"Open questions: copy handoff"** copies the same list as markdown.
5. The skill in `agent/` is the single description of when to ask, how to phrase options and
   how to check for answers.
