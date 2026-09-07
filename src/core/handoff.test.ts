import { describe, expect, it } from 'vitest';
import { questions } from './blocks';
import { handoffLine, handoffMarkdown } from './handoff';

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
