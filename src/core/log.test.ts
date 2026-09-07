import { describe, expect, it } from 'vitest';
import { findBlocks, type DecisionBlock } from './blocks';
import { appendLogLine, formatLogLine, resolveLogTarget, resolvePath, slug } from './log';
import type { VaultFiles } from './workspace';

function vault(files: Record<string, string>): VaultFiles {
	return { exists: (p) => p in files, read: (p) => files[p] ?? null };
}

const withLog = '# INDEX\n\n## Decision log\n\n_(Append-only.)_\n\n- **2026-09-01** — old\n';

describe('resolvePath and slug', () => {
	it('resolves relative references against the note directory', () => {
		expect(resolvePath('obsidian/specs', 'INDEX.md')).toBe('obsidian/specs/INDEX.md');
		expect(resolvePath('obsidian/specs', '../INDEX.md')).toBe('obsidian/INDEX.md');
		expect(resolvePath('obsidian/specs', './a/../b.md')).toBe('obsidian/specs/b.md');
		expect(resolvePath('obsidian/specs', '/DECISIONS.md')).toBe('DECISIONS.md');
		expect(resolvePath('', 'x.md')).toBe('x.md');
	});

	it('slugs headings the way anchors are written', () => {
		expect(slug('Decision log')).toBe('decision-log');
		expect(slug('## Open questions / risks')).toBe('open-questions-risks');
	});
});

describe('resolveLogTarget', () => {
	it('honours an explicit log target with anchor, relative to the note', () => {
		const files = vault({ 'obsidian/INDEX.md': withLog });
		expect(resolveLogTarget('obsidian/specs/SPEC.md', '../INDEX.md#decision-log', files, 'obsidian')).toEqual({ path: 'obsidian/INDEX.md', anchor: 'decision-log', create: false });
		expect(resolveLogTarget('obsidian/specs/SPEC.md', 'LOG.md', files, 'obsidian')).toEqual({ path: 'obsidian/specs/LOG.md', anchor: null, create: true });
	});

	it('defaults to the nearest INDEX.md with a decision log heading', () => {
		const files = vault({ 'w/keel.json': '{}', 'w/p/INDEX.md': '# no log here', 'w/INDEX.md': withLog });
		expect(resolveLogTarget('w/p/specs/a.md', null, files, 'w')).toEqual({ path: 'w/INDEX.md', anchor: 'decision-log', create: false });
	});

	it('does not climb above the workspace root, then falls back to DECISIONS.md', () => {
		const files = vault({ 'INDEX.md': withLog, 'w/keel.json': '{}', 'w/DECISIONS.md': '' });
		expect(resolveLogTarget('w/p/a.md', null, files, 'w')).toEqual({ path: 'w/DECISIONS.md', anchor: null, create: false });
		expect(resolveLogTarget('w/p/a.md', null, vault({ 'INDEX.md': withLog, 'w/keel.json': '{}' }), 'w')).toBeNull();
	});

	it('in plain mode searches the whole vault and never invents DECISIONS.md', () => {
		expect(resolveLogTarget('a/b/c.md', null, vault({ 'INDEX.md': withLog }), null)?.path).toBe('INDEX.md');
		expect(resolveLogTarget('a/b/c.md', null, vault({}), null)).toBeNull();
	});
});

describe('formatLogLine', () => {
	const d = findBlocks([
		'> [!decision] Q-3 Which brand prefix for plugin ids?',
		'> **keel** — the tool the plugins light up for',
		'> asked: 2026-09-07 · by: claude · decided: 2026-09-07 · by: Johannes',
	].join('\n'))[0] as DecisionBlock;

	it('matches the spec line exactly', () => {
		expect(formatLogLine(d, 'obsidian/specs/SPEC-integration.md', '2026-09-07')).toBe(
			'- **2026-09-07** — Q-3 Which brand prefix for plugin ids? → **keel**. **Why:** the tool the plugins light up for. _(from `obsidian/specs/SPEC-integration.md`)_',
		);
	});

	it('lists several choices, uses the note when there is no rationale, and omits why when neither exists', () => {
		const many: DecisionBlock = { ...d, chosen: [{ text: 'a', rationale: 'one.' }, { text: 'b', rationale: null }], note: 'typed' };
		expect(formatLogLine(many, 'n.md', '2026-09-08')).toBe('- **2026-09-08** — Q-3 Which brand prefix for plugin ids? → **a**, **b**. **Why:** one. _(from `n.md`)_');
		const other: DecisionBlock = { ...d, chosen: [{ text: 'other', rationale: null }], note: 'free text' };
		expect(formatLogLine(other, 'n.md', '2026-09-08')).toContain('→ **other**. **Why:** free text. _(');
		const bare: DecisionBlock = { ...d, chosen: [{ text: 'x', rationale: null }], note: null };
		expect(formatLogLine(bare, 'n.md', '2026-09-08')).toBe('- **2026-09-08** — Q-3 Which brand prefix for plugin ids? → **x**. _(from `n.md`)_');
	});
});

describe('appendLogLine', () => {
	it('appends at the end of the anchored section, before the next heading', () => {
		const text = '# T\n\n## Decision log\n\n- a\n- b\n\n## Next\n\ntext\n';
		expect(appendLogLine(text, 'decision-log', '- c')).toBe('# T\n\n## Decision log\n\n- a\n- b\n- c\n\n## Next\n\ntext\n');
	});

	it('keeps deeper headings inside the section', () => {
		const text = '## Decision log\n\n### 2026\n\n- a\n\n# Top\n';
		expect(appendLogLine(text, 'decision-log', '- c')).toBe('## Decision log\n\n### 2026\n\n- a\n- c\n\n# Top\n');
	});

	it('falls back to the end of the file when the anchor is missing or absent', () => {
		expect(appendLogLine('# T\n\n- a\n\n\n', 'nope', '- c')).toBe('# T\n\n- a\n- c\n');
		expect(appendLogLine('', null, '- c')).toBe('- c\n');
	});
});
