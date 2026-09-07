// The decision-log append rule (SPEC-integration §C2). No 'obsidian' import.

import type { DecisionBlock } from './blocks';
import { ancestors, dirname, join, type VaultFiles } from './workspace';

export interface LogTarget {
	/** Vault path of the log file. */
	path: string;
	/** Heading slug to append under, or null for the end of the file. */
	anchor: string | null;
	/** True when the file does not exist yet and the agent named it explicitly. */
	create: boolean;
}

const DECISION_LOG = /^#{1,6}\s+decision log\s*$/im;

/** Resolve `a/b/../c` style references against a directory; a leading `/` means the vault root. */
export function resolvePath(fromDir: string, rel: string): string {
	const parts = rel.startsWith('/') ? [] : fromDir.split('/').filter(Boolean);
	for (const seg of rel.split('/')) {
		if (seg === '' || seg === '.') continue;
		if (seg === '..') parts.pop();
		else parts.push(seg);
	}
	return parts.join('/');
}

export function slug(heading: string): string {
	return heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

/**
 * Where a decision is appended. Explicit `log:` is relative to the note (optionally `#heading`);
 * the default is the nearest `INDEX.md` above the note with a `## Decision log` heading, then
 * `DECISIONS.md` at the workspace root, then nowhere (the block itself is the record).
 */
export function resolveLogTarget(notePath: string, log: string | null, files: VaultFiles, workspaceRoot: string | null): LogTarget | null {
	if (log) {
		const hash = log.indexOf('#');
		const file = hash < 0 ? log : log.slice(0, hash);
		const anchor = hash < 0 ? null : slug(log.slice(hash + 1)) || null;
		const path = resolvePath(dirname(notePath), file);
		return { path, anchor, create: !files.exists(path) };
	}
	for (const dir of ancestors(notePath)) {
		if (workspaceRoot !== null && !within(dir, workspaceRoot)) break;
		const index = join(dir, 'INDEX.md');
		if (files.exists(index) && DECISION_LOG.test(files.read(index) ?? '')) return { path: index, anchor: 'decision-log', create: false };
	}
	if (workspaceRoot !== null) {
		const decisions = join(workspaceRoot, 'DECISIONS.md');
		if (files.exists(decisions)) return { path: decisions, anchor: null, create: false };
	}
	return null;
}

function within(dir: string, root: string): boolean {
	return root === '' || dir === root || dir.startsWith(root + '/');
}

function sentence(s: string): string {
	return s.trim().replace(/[.。]+$/, '');
}

/** One log line, in the shape §C2 gives. The "why" is the chosen rationale, else the note. */
export function formatLogLine(d: DecisionBlock, notePath: string, date: string): string {
	const choice = d.chosen.map((c) => '**' + c.text + '**').join(', ');
	const why = d.chosen.map((c) => c.rationale).filter((r): r is string => !!r).map(sentence).join('; ') || (d.note ? sentence(d.note) : '');
	return '- **' + date + '** — ' + d.id + ' ' + d.title + ' → ' + choice + '.' + (why ? ' **Why:** ' + why + '.' : '') + ' _(from `' + notePath + '`)_';
}

/** Append `line` under the heading whose slug matches `anchor`, else at the end of the file. */
export function appendLogLine(text: string, anchor: string | null, line: string): string {
	const lines = text.length ? text.split('\n') : [];
	let insertAt = -1;
	if (anchor) {
		let level = 0;
		for (let i = 0; i < lines.length; i++) {
			const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(lines[i] ?? '');
			if (!h) continue;
			const hl = (h[1] ?? '').length;
			if (level === 0) { if (slug(h[2] ?? '') === anchor) { level = hl; insertAt = i + 1; } continue; }
			if (hl <= level) break;
			insertAt = i + 1;
		}
		if (level > 0) {
			let end = insertAt;
			for (let i = insertAt; i < lines.length; i++) {
				const h = /^(#{1,6})\s/.exec(lines[i] ?? '');
				if (h && (h[1] ?? '').length <= level) break;
				if ((lines[i] ?? '').trim() !== '') end = i + 1;
			}
			lines.splice(end, 0, line);
			return lines.join('\n');
		}
	}
	while (lines.length && (lines[lines.length - 1] ?? '').trim() === '') lines.pop();
	lines.push(line, '');
	return lines.join('\n');
}
