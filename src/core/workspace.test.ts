import { describe, expect, it } from 'vitest';
import { ancestors, dirname, findWorkspace, join, type VaultFiles } from './workspace';

function vault(files: Record<string, string>): VaultFiles {
	return {
		exists: (p) => p in files,
		read: (p) => files[p] ?? null,
	};
}

const keel = JSON.stringify({ name: 'obsidian', projects: [{ name: 'board-plugin' }, { name: 'open-question-plugin' }] });

describe('paths', () => {
	it('dirname and join treat the vault root as the empty string', () => {
		expect(dirname('a/b/c.md')).toBe('a/b');
		expect(dirname('c.md')).toBe('');
		expect(join('', 'keel.json')).toBe('keel.json');
		expect(join('a', 'keel.json')).toBe('a/keel.json');
	});

	it('ancestors are nearest first and end with the root', () => {
		expect(ancestors('a/b/c.md')).toEqual(['a/b', 'a', '']);
		expect(ancestors('c.md')).toEqual(['']);
	});
});

describe('findWorkspace', () => {
	it('returns null in plain mode', () => {
		expect(findWorkspace('notes/todo.md', vault({ 'notes/todo.md': '' }))).toBeNull();
	});

	it('finds the nearest keel.json and the project of a note', () => {
		const files = vault({ 'obsidian/keel.json': keel });
		expect(findWorkspace('obsidian/board-plugin/INDEX.md', files)).toEqual({
			root: 'obsidian',
			name: 'obsidian',
			projects: ['board-plugin', 'open-question-plugin'],
			project: 'board-plugin',
		});
	});

	it('is workspace-level when the first segment is not a declared project', () => {
		const files = vault({ 'obsidian/keel.json': keel });
		expect(findWorkspace('obsidian/specs/SPEC.md', files)?.project).toBeNull();
		expect(findWorkspace('obsidian/INDEX.md', files)?.project).toBeNull();
	});

	it('prefers the nearest manifest when workspaces nest', () => {
		const files = vault({ 'keel.json': JSON.stringify({ projects: ['x'] }), 'x/inner/keel.json': keel });
		expect(findWorkspace('x/inner/board-plugin/a.md', files)?.root).toBe('x/inner');
		expect(findWorkspace('x/other.md', files)).toEqual({ root: '', name: 'vault', projects: ['x'], project: 'x' });
	});

	it('tolerates a broken manifest', () => {
		const files = vault({ 'w/keel.json': '{not json' });
		expect(findWorkspace('w/a/b.md', files)).toEqual({ root: 'w', name: 'w', projects: [], project: null });
	});
});
