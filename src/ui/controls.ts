import { setTooltip } from 'obsidian';
import { isAnswered, type Chosen, type QuestionBlock } from '../core/blocks';

export interface ControlHandlers {
	/** One or more options were picked. */
	choose(chosen: Chosen[]): void;
	/** "Other…" was picked, with whatever else is selected under `pick: many`. */
	other(selected: Chosen[]): void;
	/** Ticked boxes should be written as the decision. */
	record(): void;
}

export const ACTIONS_CLASS = 'keel-open-questions-actions';

/** The button row under a question block. Shared by reading view and live preview. */
export function renderControls(container: HTMLElement, q: QuestionBlock, h: ControlHandlers): HTMLElement {
	const row = container.createDiv({ cls: ACTIONS_CLASS });
	if (isAnswered(q)) {
		row.createSpan({ cls: 'keel-open-questions-hint', text: 'Answered by ticking' });
		row.createEl('button', { cls: 'keel-open-questions-record mod-cta', text: 'Record answer' }).addEventListener('click', () => h.record());
		return row;
	}
	const selected = new Set<number>();
	const chosen = (): Chosen[] => q.options.filter((_, i) => selected.has(i)).map((o) => ({ text: o.text, rationale: o.rationale }));
	q.options.forEach((o, i) => {
		const b = row.createEl('button', { cls: 'keel-open-questions-option', text: o.text });
		if (o.rationale) setTooltip(b, o.rationale);
		b.addEventListener('click', () => {
			if (q.pick === 'one') { h.choose([{ text: o.text, rationale: o.rationale }]); return; }
			if (selected.has(i)) selected.delete(i); else selected.add(i);
			b.toggleClass('is-active', selected.has(i));
		});
	});
	row.createEl('button', { cls: 'keel-open-questions-other', text: 'Other…' }).addEventListener('click', () => h.other(chosen()));
	if (q.pick === 'many') {
		row.createEl('button', { cls: 'keel-open-questions-decide mod-cta', text: 'Decide' }).addEventListener('click', () => {
			if (selected.size) h.choose(chosen());
		});
	}
	return row;
}
