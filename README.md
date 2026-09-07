# Keel Open Questions

Let your AI agent ask you questions inside your notes, and answer them with a click.

**Obsidian plugin** · id `keel-open-questions` · status: beta, not yet on the registry · MIT

An agent writing a spec, plan or ADR leaves a `[!question]` callout with options where the
answer belongs. This plugin renders the options as buttons in live preview and reading view.
Clicking one rewrites the block into a dated `[!decision]` and appends a line to the nearest
decision log. The agent reads the decision on its next run. Nothing leaves the vault: no API
keys, no network, no model calls. Works with Claude Code, GitHub Copilot, Gemini CLI or any
agent that can write markdown, because the protocol is markdown.

## Part of a family

Keel Open Questions is one of the keel Obsidian plugins, five open-source plugins that make Obsidian a
better surface for working with AI coding agents on a vault of specs, plans and boards. Each
plugin stands alone; together they follow one integration spec. They light up extra features
in a vault managed by [keel](https://github.com/JohannesMerwe/pangolin-keel), and stay useful
without it.

| Plugin | Does |
|---|---|
| [Keel Open Questions](https://github.com/JohannesMerwe/obsidian-open-questions) | agents ask questions in your notes; you answer with a click; decisions get logged |
| [Keel Board](https://github.com/JohannesMerwe/obsidian-board) | kanban over a folder of markdown cards; dragging moves the file |
| [Keel Cockpit](https://github.com/JohannesMerwe/obsidian-cockpit) | session context, keel verbs and handoff diff inside the vault |
| [Keel Keys](https://github.com/JohannesMerwe/obsidian-keys) | ticket-style ids as links, autocomplete and next-number creation |
| [Keel Diagram](https://github.com/JohannesMerwe/obsidian-diagram) | edit Mermaid and D2 in place; text stays the source of truth |

This plugin owns the question block and decision block conventions and the decision-log append rule (SPEC-integration §C2), plus the handoff skill agents follow.

## What it does

- **Renders question blocks** — `[!question] Q-N …` callouts with task-list options — as
  buttons, in reading view and live preview. An **Other…** button takes a free-text answer.
- **Resolves on click**: the block is rewritten into a dated `[!decision]`, an optional note
  is asked for, and one line is appended to the decision log (the nearest `INDEX.md` with a
  `## Decision log` heading, or the `log:` the agent named).
- **Ticked boxes count as answers**: a question answered without the plugin gets a
  *Record answer* button that performs the same rewrite.
- **Commands**: *Open questions: list* jumps to any unanswered question in the current keel
  workspace (or the vault); *Open questions: copy handoff* copies the same list as markdown
  for pasting into an agent prompt. A status-bar item shows the count.
- **Settings**: your name on decisions, whether to ask for a note, the status-bar item.

The convention itself is documented in [`docs/QUESTION_BLOCKS.md`](docs/QUESTION_BLOCKS.md).

## Principles

- Plain markdown first. No keel required.
- Integration with agents is files, not API calls. No keys, no network, no telemetry.
- Pure core in `src/core/` with no `obsidian` import, unit-tested; a thin Obsidian shell around it.

## Develop

```sh
npm install
npm run dev      # esbuild watch → main.js
npm run build    # tsc + esbuild production
npm run lint
```

Point a throwaway dev vault's `.obsidian/plugins/keel-open-questions/` at this directory (a
symlink works) and drop an empty `.hotreload` file here so the
[hot-reload](https://github.com/pjeby/hot-reload) plugin reloads it on every rebuild. Releases
are GitHub releases whose tag equals the `manifest.json` version, no `v`; the workflow in
`.github/workflows/release.yml` builds and attaches `main.js`, `manifest.json` and `styles.css`.

## Install

Until the plugin is on the community registry, install it with
[BRAT](https://github.com/TfTHacker/obsidian42-brat): *Add beta plugin* →
`JohannesMerwe/obsidian-open-questions`. Requires Obsidian 1.13.0 or later.

## Agent skills

`agent/` holds the same instructions in two formats, telling an agent when to ask, how to
phrase options, how to check for answers at session start, how to hand off at session end,
and what it must never do (resolve a question itself):

- `agent/claude/keel-open-questions/SKILL.md` — copy the folder into `.claude/skills/`.
- `agent/copilot/keel-open-questions.prompt.md` — copy into `.github/prompts/`.

Keel links them for you once its skills linking lands.

## Tests

```sh
npm test         # vitest over src/core
```
