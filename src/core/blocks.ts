// Contract C2 — question blocks and decision blocks (SPEC-integration §C2). This plugin owns the
// convention; other repos copy this parser and do not redefine the format. No 'obsidian' import.

export interface Option {
	text: string;
	/** Text after ` — ` on the option line, or null. */
	rationale: string | null;
	ticked: boolean;
}

export interface Chosen {
	text: string;
	rationale: string | null;
}

interface BlockBase {
	/** `Q-N`, sequential per file. The global key is `<vault path>#Q-N`. */
	id: string;
	title: string;
	/** Body lines between the title and the options, without the `> ` prefix. */
	context: string[];
	asked: string | null;
	askedBy: string | null;
	/** Card ids (§C4) that wait on this answer. */
	blocks: string[];
	/** 0-based line index of the callout header in the source text. */
	lineStart: number;
	/** 0-based line index of the last line of the callout, inclusive. */
	lineEnd: number;
}

export interface QuestionBlock extends BlockBase {
	kind: 'question';
	options: Option[];
	pick: 'one' | 'many';
	/** `log:` value as written (relative to the note), or null for the default target. */
	log: string | null;
}

export interface DecisionBlock extends BlockBase {
	kind: 'decision';
	chosen: Chosen[];
	decided: string | null;
	decidedBy: string | null;
	note: string | null;
}

export type Block = QuestionBlock | DecisionBlock;

export interface Resolution {
	chosen: Chosen[];
	decided: string;
	decidedBy: string;
	note?: string | null;
}

const HEADER = /^\[!(question|decision)\][+-]?\s*(Q-\d+)\s*(.*)$/i;
const CALLOUT_LINE = /^ {0,3}>/;
const OPTION = /^[-*+] \[([ xX])\]\s+(.*)$/;
const CHOSEN = /^\*\*(.+?)\*\*(?:\s+—\s+(.*))?$/;
const META_KEYS = new Set(['asked', 'by', 'pick', 'log', 'blocks', 'decided', 'note']);
const META_LINE = /^(asked|by|pick|log|blocks|decided|note):\s*/i;
const SEP = ' — ';

/** Strip the blockquote marker from a callout line. */
function inner(line: string): string {
	return line.replace(/^ {0,3}>[ ]?/, '');
}

function isMeta(line: string): boolean {
	return META_LINE.test(line);
}

function parseMeta(line: string): [string, string][] {
	if (/^note:/i.test(line)) return [['note', line.replace(/^note:\s*/i, '')]];
	return line.split(/\s*·\s*/).flatMap((part) => {
		const m = /^([a-z]+):\s*(.*)$/i.exec(part.trim());
		return m && META_KEYS.has((m[1] ?? '').toLowerCase()) ? [[(m[1] ?? '').toLowerCase(), (m[2] ?? '').trim()]] : [];
	});
}

function splitRationale(text: string): { text: string; rationale: string | null } {
	const i = text.indexOf(SEP);
	return i < 0 ? { text: text.trim(), rationale: null } : { text: text.slice(0, i).trim(), rationale: text.slice(i + SEP.length).trim() || null };
}

function trimBlank(lines: string[]): string[] {
	let a = 0;
	let b = lines.length;
	while (a < b && (lines[a] ?? '').trim() === '') a++;
	while (b > a && (lines[b - 1] ?? '').trim() === '') b--;
	return lines.slice(a, b);
}

/** Every question and decision block in a note, in document order. Callouts without a `Q-N` id are not ours. */
export function findBlocks(text: string): Block[] {
	const lines = text.split('\n');
	const out: Block[] = [];
	let inFence = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
		if (inFence || !CALLOUT_LINE.test(line)) continue;
		const header = HEADER.exec(inner(line));
		if (!header) continue;
		let end = i;
		while (end + 1 < lines.length && CALLOUT_LINE.test(lines[end + 1] ?? '') && !HEADER.test(inner(lines[end + 1] ?? ''))) end++;
		const body = lines.slice(i + 1, end + 1).map(inner);
		const block = build(header[1]?.toLowerCase() === 'question' ? 'question' : 'decision', header[2] ?? '', (header[3] ?? '').trim(), body, i, end);
		out.push(block);
		i = end;
	}
	return out;
}

function build(kind: 'question' | 'decision', id: string, title: string, body: string[], lineStart: number, lineEnd: number): Block {
	const base = { id, title, context: [] as string[], asked: null as string | null, askedBy: null as string | null, blocks: [] as string[], lineStart, lineEnd };
	const options: Option[] = [];
	const chosen: Chosen[] = [];
	const context: string[] = [];
	let pick: 'one' | 'many' = 'one';
	let log: string | null = null;
	let decided: string | null = null;
	let decidedBy: string | null = null;
	let note: string | null = null;
	let lastDate: 'asked' | 'decided' = 'asked';
	for (const raw of body) {
		const line = raw.trimEnd();
		const opt = OPTION.exec(line.trim());
		if (opt) { options.push({ ...splitRationale(opt[2] ?? ''), ticked: (opt[1] ?? ' ') !== ' ' }); continue; }
		const ch = kind === 'decision' ? CHOSEN.exec(line.trim()) : null;
		if (ch) { chosen.push({ text: (ch[1] ?? '').trim(), rationale: ch[2]?.trim() || null }); continue; }
		if (isMeta(line.trim())) {
			for (const [key, value] of parseMeta(line.trim())) {
				if (key === 'asked') { base.asked = value || null; lastDate = 'asked'; }
				else if (key === 'decided') { decided = value || null; lastDate = 'decided'; }
				else if (key === 'by') { if (lastDate === 'decided') decidedBy = value || null; else base.askedBy = value || null; }
				else if (key === 'pick') pick = value.toLowerCase() === 'many' ? 'many' : 'one';
				else if (key === 'log') log = value || null;
				else if (key === 'blocks') base.blocks = value.split(',').map((s) => s.trim()).filter(Boolean);
				else if (key === 'note') note = value || null;
			}
			continue;
		}
		context.push(line);
	}
	base.context = trimBlank(context);
	if (kind === 'question') return { kind, ...base, options, pick, log };
	return { kind, ...base, chosen, decided, decidedBy, note };
}

export function questions(text: string): QuestionBlock[] {
	return findBlocks(text).filter((b): b is QuestionBlock => b.kind === 'question');
}

/** A ticked option is an answer (§C2); such a question is answered but not yet recorded. */
export function isAnswered(q: QuestionBlock): boolean {
	return q.options.some((o) => o.ticked);
}

export function openQuestions(text: string): QuestionBlock[] {
	return questions(text).filter((q) => !isAnswered(q));
}

/** Highest existing N in the file + 1, over question and decision blocks. */
export function nextQuestionId(text: string): string {
	let max = 0;
	for (const m of text.matchAll(/^ {0,3}>\s*\[!(?:question|decision)\][+-]?\s*Q-(\d+)/gim)) max = Math.max(max, Number(m[1]));
	return 'Q-' + String(max + 1);
}

export function globalKey(notePath: string, id: string): string {
	return notePath + '#' + id;
}

function metaLine(pairs: [string, string | null][]): string {
	return pairs.filter((p): p is [string, string] => !!p[1]).map(([k, v]) => k + ': ' + v).join(' · ');
}

function chosenLine(c: Chosen): string {
	return '**' + c.text + '**' + (c.rationale ? SEP + c.rationale : '');
}

export function serialiseQuestion(q: QuestionBlock): string {
	const lines = ['[!question] ' + q.id + ' ' + q.title, ...q.context];
	for (const o of q.options) lines.push('- [' + (o.ticked ? 'x' : ' ') + '] ' + o.text + (o.rationale ? SEP + o.rationale : ''));
	lines.push(metaLine([['asked', q.asked], ['by', q.askedBy], ['pick', q.pick], ['log', q.log], ['blocks', q.blocks.join(', ') || null]]));
	return lines.map((l) => (l === '' ? '>' : '> ' + l)).join('\n');
}

export function serialiseDecision(d: DecisionBlock): string {
	const lines = ['[!decision] ' + d.id + ' ' + d.title, ...d.chosen.map(chosenLine), ...d.context];
	lines.push(metaLine([['asked', d.asked], ['by', d.askedBy], ['decided', d.decided], ['by', d.decidedBy], ['blocks', d.blocks.join(', ') || null]]));
	if (d.note) lines.push('note: ' + d.note);
	return lines.map((l) => (l === '' ? '>' : '> ' + l)).join('\n');
}

/** The decision a question becomes. Unchosen options are dropped; `log:` is dropped once the log line is written. */
export function toDecision(q: QuestionBlock, r: Resolution): DecisionBlock {
	return { kind: 'decision', id: q.id, title: q.title, context: q.context, asked: q.asked, askedBy: q.askedBy, blocks: q.blocks, lineStart: q.lineStart, lineEnd: q.lineEnd, chosen: r.chosen, decided: r.decided, decidedBy: r.decidedBy, note: r.note?.trim() || null };
}

/** The resolution implied by ticked boxes, or null when nothing is ticked. */
export function tickedResolution(q: QuestionBlock, decided: string, decidedBy: string): Resolution | null {
	const chosen = q.options.filter((o) => o.ticked).map((o) => ({ text: o.text, rationale: o.rationale }));
	return chosen.length ? { chosen, decided, decidedBy } : null;
}

export function replaceLines(text: string, lineStart: number, lineEnd: number, replacement: string): string {
	const lines = text.split('\n');
	lines.splice(lineStart, lineEnd - lineStart + 1, ...replacement.split('\n'));
	return lines.join('\n');
}

/** Rewrite question `id` in `text` into a decision. Null when the block is not there any more. */
export function resolveInText(text: string, id: string, r: Resolution): { text: string; decision: DecisionBlock } | null {
	const q = questions(text).find((b) => b.id === id);
	if (!q) return null;
	const decision = toDecision(q, r);
	return { text: replaceLines(text, q.lineStart, q.lineEnd, serialiseDecision(decision)), decision };
}
