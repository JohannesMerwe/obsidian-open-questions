// The handoff list (SPEC-integration §C2, handoff logic steps 2 and 4). No 'obsidian' import.

import type { QuestionBlock } from './blocks';

export interface OpenQuestion {
	/** Vault path of the note holding the block. */
	path: string;
	block: QuestionBlock;
}

function link(item: OpenQuestion): string {
	const label = item.block.id + ' ' + item.block.title;
	return '[' + label.replace(/[[\]]/g, '') + '](' + encodeURI(item.path) + ')';
}

/** One line per open question: a link, who asked and when, the options, and what waits on it. */
export function handoffLine(item: OpenQuestion): string {
	const q = item.block;
	const parts = [link(item)];
	if (q.asked || q.askedBy) parts.push('asked' + (q.asked ? ' ' + q.asked : '') + (q.askedBy ? ' by ' + q.askedBy : ''));
	if (q.pick === 'many') parts.push('pick many');
	if (q.options.length) parts.push('options: ' + q.options.map((o) => o.text).join(' | '));
	if (q.blocks.length) parts.push('blocks: ' + q.blocks.join(', '));
	return '- ' + parts.join(' · ');
}

/** Markdown for `## Open questions` in `.keel/context.md`, or for pasting into a prompt. */
export function handoffMarkdown(items: OpenQuestion[], heading = '## Open questions'): string {
	const body = items.length ? items.map(handoffLine).join('\n') : '- _none_';
	return heading + '\n\n' + body + '\n';
}
