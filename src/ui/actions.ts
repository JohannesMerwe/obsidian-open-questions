import type { App } from 'obsidian';
import type { Chosen, QuestionBlock } from '../core/blocks';
import type { Resolver } from '../resolver';
import type { KeelOpenQuestionsSettings } from '../settings';
import { renderControls, type ControlHandlers } from './controls';
import { askNote, askOther } from './modals';

/** Wire the button row to the resolver and the modals, for a block in a given note. */
export function attachControls(container: HTMLElement, q: QuestionBlock, path: string, app: App, resolver: Resolver, settings: () => KeelOpenQuestionsSettings): HTMLElement {
	const title = q.id + ' ' + q.title;
	const handlers: ControlHandlers = {
		choose: (chosen: Chosen[]) => {
			void (async () => {
				const note = settings().askNote ? await askNote(app, title) : '';
				if (note === null) return;
				await resolver.resolve(path, q.id, chosen, note || null);
			})();
		},
		other: (selected: Chosen[]) => {
			void (async () => {
				const answer = await askOther(app, title);
				if (!answer) return;
				await resolver.resolve(path, q.id, [...selected, { text: answer.text, rationale: null }], answer.note || null);
			})();
		},
		record: () => void resolver.recordTicked(path, q.id),
	};
	return renderControls(container, q, handlers);
}
