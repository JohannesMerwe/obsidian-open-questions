import { describe, expect, it } from 'vitest';
import {
	findBlocks, globalKey, isAnswered, nextQuestionId, openQuestions, questions, resolveInText,
	serialiseDecision, serialiseQuestion, tickedResolution, toDecision, type QuestionBlock,
} from './blocks';

const question = [
	'> [!question] Q-3 Which brand prefix for plugin ids?',
	'> Ids cannot contain "obsidian". The prefix is the marketing hook back to the suite.',
	'> - [ ] keel — the tool the plugins light up for',
	'> - [ ] pangolin — the suite name',
	'> - [ ] none — neutral names',
	'> asked: 2026-09-07 · by: claude · pick: one · log: INDEX.md#decision-log',
].join('\n');

const decision = [
	'> [!decision] Q-3 Which brand prefix for plugin ids?',
	'> **keel** — the tool the plugins light up for',
	'> asked: 2026-09-07 · by: claude · decided: 2026-09-07 · by: Johannes',
	'> note: repos stay `obsidian-<name>`',
].join('\n');

const note = ['# Spec', '', 'Intro.', '', question, '', 'Between.', '', decision, ''].join('\n');

describe('findBlocks', () => {
	it('parses the spec question block exactly', () => {
		const [q] = findBlocks(question);
		expect(q).toMatchObject({
			kind: 'question',
			id: 'Q-3',
			title: 'Which brand prefix for plugin ids?',
			context: ['Ids cannot contain "obsidian". The prefix is the marketing hook back to the suite.'],
			asked: '2026-09-07',
			askedBy: 'claude',
			pick: 'one',
			log: 'INDEX.md#decision-log',
			blocks: [],
			lineStart: 0,
			lineEnd: 5,
		});
		expect((q as QuestionBlock).options).toEqual([
			{ text: 'keel', rationale: 'the tool the plugins light up for', ticked: false },
			{ text: 'pangolin', rationale: 'the suite name', ticked: false },
			{ text: 'none', rationale: 'neutral names', ticked: false },
		]);
	});

	it('parses the spec decision block exactly', () => {
		const [d] = findBlocks(decision);
		expect(d).toMatchObject({
			kind: 'decision',
			id: 'Q-3',
			chosen: [{ text: 'keel', rationale: 'the tool the plugins light up for' }],
			asked: '2026-09-07',
			askedBy: 'claude',
			decided: '2026-09-07',
			decidedBy: 'Johannes',
			note: 'repos stay `obsidian-<name>`',
		});
	});

	it('finds blocks by line in a longer note and ignores fenced examples', () => {
		const blocks = findBlocks(note);
		expect(blocks.map((b) => [b.kind, b.lineStart, b.lineEnd])).toEqual([['question', 4, 9], ['decision', 13, 16]]);
		const fenced = '```markdown\n' + question + '\n```\n';
		expect(findBlocks(fenced)).toEqual([]);
	});

	it('reads pick many, blocks, ticks, fold markers and a separate blocks line', () => {
		const text = [
			'> [!question]- Q-7 Which columns?',
			'> - [x] a',
			'> - [ ] b — because',
			'> - [X] c',
			'> asked: 2026-09-07 · by: copilot · pick: many',
			'> blocks: KB-3, KQ-1',
		].join('\n');
		const q = questions(text)[0];
		expect(q?.pick).toBe('many');
		expect(q?.blocks).toEqual(['KB-3', 'KQ-1']);
		expect(q?.options.map((o) => o.ticked)).toEqual([true, false, true]);
		expect(q && isAnswered(q)).toBe(true);
		expect(openQuestions(text)).toEqual([]);
	});

	it('leaves ordinary question callouts without a Q-N id alone', () => {
		expect(findBlocks('> [!question] What is this?\n> - [ ] a\n')).toEqual([]);
		expect(findBlocks('> [!info] Q-1 Not ours\n')).toEqual([]);
	});

	it('splits two adjacent callouts', () => {
		const text = question + '\n' + question.replace('Q-3', 'Q-4');
		expect(findBlocks(text).map((b) => b.id)).toEqual(['Q-3', 'Q-4']);
	});
});

describe('minting', () => {
	it('mints highest N in the file plus one over questions and decisions', () => {
		expect(nextQuestionId('')).toBe('Q-1');
		expect(nextQuestionId(note)).toBe('Q-4');
		expect(nextQuestionId('> [!decision] Q-12 x\n> [!question] Q-9 y\n')).toBe('Q-13');
	});

	it('forms the global key from the vault path', () => {
		expect(globalKey('obsidian/specs/SPEC-integration.md', 'Q-3')).toBe('obsidian/specs/SPEC-integration.md#Q-3');
	});
});

describe('serialise', () => {
	it('round-trips the spec question block', () => {
		const q = questions(question)[0];
		expect(q && serialiseQuestion(q)).toBe(question);
	});

	it('round-trips the spec decision block', () => {
		const d = findBlocks(decision)[0];
		expect(d?.kind === 'decision' && serialiseDecision(d)).toBe(decision);
	});
});

describe('resolveInText', () => {
	it('rewrites the question into the spec decision block, drops unchosen options and log', () => {
		const r = resolveInText(note, 'Q-3', {
			chosen: [{ text: 'keel', rationale: 'the tool the plugins light up for' }],
			decided: '2026-09-07',
			decidedBy: 'Johannes',
			note: 'repos stay `obsidian-<name>`',
		});
		expect(r).not.toBeNull();
		const expected = [
			'> [!decision] Q-3 Which brand prefix for plugin ids?',
			'> **keel** — the tool the plugins light up for',
			'> Ids cannot contain "obsidian". The prefix is the marketing hook back to the suite.',
			'> asked: 2026-09-07 · by: claude · decided: 2026-09-07 · by: Johannes',
			'> note: repos stay `obsidian-<name>`',
		].join('\n');
		expect(r?.text).toBe(note.replace(question, expected));
		expect(r?.decision.chosen).toEqual([{ text: 'keel', rationale: 'the tool the plugins light up for' }]);
		expect(findBlocks(r?.text ?? '').map((b) => b.kind)).toEqual(['decision', 'decision']);
	});

	it('lists each chosen line for pick many and keeps blocks', () => {
		const text = '> [!question] Q-1 Which?\n> - [ ] a — one\n> - [ ] b\n> asked: 2026-09-07 · by: claude · pick: many · blocks: KB-3\n';
		const r = resolveInText(text, 'Q-1', { chosen: [{ text: 'a', rationale: 'one' }, { text: 'b', rationale: null }], decided: '2026-09-08', decidedBy: 'owner' });
		expect(r?.text).toBe('> [!decision] Q-1 Which?\n> **a** — one\n> **b**\n> asked: 2026-09-07 · by: claude · decided: 2026-09-08 · by: owner · blocks: KB-3\n');
	});

	it('returns null when the question is gone', () => {
		expect(resolveInText(note, 'Q-99', { chosen: [], decided: '', decidedBy: '' })).toBeNull();
	});

	it('turns ticked boxes into a resolution', () => {
		const q = questions(question.replace('- [ ] pangolin', '- [x] pangolin'))[0];
		expect(q && tickedResolution(q, '2026-09-08', 'Johannes')).toEqual({ chosen: [{ text: 'pangolin', rationale: 'the suite name' }], decided: '2026-09-08', decidedBy: 'Johannes' });
		const untouched = questions(question)[0];
		expect(untouched && tickedResolution(untouched, '', '')).toBeNull();
		expect(untouched && toDecision(untouched, { chosen: [{ text: 'other', rationale: null }], decided: 'd', decidedBy: 'me', note: '  ' }).note).toBeNull();
	});
});
