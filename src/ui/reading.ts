import type { App, MarkdownPostProcessor, MarkdownPostProcessorContext } from 'obsidian';
import { findBlocks, type QuestionBlock } from '../core/blocks';
import type { Resolver } from '../resolver';
import type { KeelOpenQuestionsSettings } from '../settings';
import { attachControls } from './actions';
import { ACTIONS_CLASS } from './controls';

const ID = /^\s*(Q-\d+)\b/;

/** Reading view: add the button row to every rendered question callout that carries a `Q-N` id. */
export function readingPostProcessor(app: App, resolver: Resolver, settings: () => KeelOpenQuestionsSettings): MarkdownPostProcessor {
	return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
		const callouts = Array.from(el.querySelectorAll<HTMLElement>('.callout[data-callout="question"]'));
		if (!callouts.length) return;
		void (async () => {
			const blocks = await blocksFor(app, el, ctx);
			for (const callout of callouts) {
				const id = ID.exec(callout.querySelector('.callout-title-inner')?.textContent ?? '')?.[1];
				const q = id && blocks.find((b) => b.id === id);
				const content = callout.querySelector<HTMLElement>('.callout-content');
				if (!q || !content || content.querySelector('.' + ACTIONS_CLASS)) continue;
				attachControls(content, q, ctx.sourcePath, app, resolver, settings);
			}
		})();
	};
}

async function blocksFor(app: App, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<QuestionBlock[]> {
	const info = ctx.getSectionInfo(el);
	let text: string;
	if (info) {
		text = info.text.split('\n').slice(info.lineStart, info.lineEnd + 1).join('\n');
	} else {
		const file = app.vault.getFileByPath(ctx.sourcePath);
		text = file ? await app.vault.cachedRead(file) : '';
	}
	return findBlocks(text).filter((b): b is QuestionBlock => b.kind === 'question');
}
