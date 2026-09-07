import { describe, expect, it } from 'vitest';
import { questions } from './blocks';
import { handoffLine, handoffMarkdown, relativeTo, withinRoot } from './handoff';

const q = questions('> [!question] Q-3 Which brand prefix for plugin ids?\n> - [ ] keel — a\n> - [ ] none\n> asked: 2026-09-07 · by: claude · pick: many · blocks: KB-3\n')[0];

describe('handoff', () => {
	it('writes one linked line per question', () => {
		expect(q && handoffLine({ path: 'obsidian/specs/SPEC integration.md', block: q })).toBe(
			'- [Q-3 Which brand prefix for plugin ids?](obsidian/specs/SPEC%20integration.md) · asked 2026-09-07 by claude · pick many · options: keel | none · blocks: KB-3',
		);
	});

	it('produces the section for .keel/context.md', () => {
		expect(handoffMarkdown([])).toBe('## Open questions\n\n- _none_\n');
		expect(q && handoffMarkdown([{ path: 'a.md', block: q }])).toMatch(/^## Open questions\n\n- \[Q-3 /);
	});
});

describe('scope', () => {
	it('bounds paths to a workspace root, with null or empty meaning the vault', () => {
		expect(withinRoot('obsidian/a.md', 'obsidian')).toBe(true);
		expect(withinRoot('obsidian-x/a.md', 'obsidian')).toBe(false);
		expect(withinRoot('a.md', null)).toBe(true);
		expect(withinRoot('a.md', '')).toBe(true);
	});

	it('relativises to the workspace directory', () => {
		expect(relativeTo('obsidian/specs/a.md', 'obsidian')).toBe('specs/a.md');
		expect(relativeTo('other/a.md', 'obsidian')).toBe('other/a.md');
		expect(relativeTo('a.md', null)).toBe('a.md');
	});
});
