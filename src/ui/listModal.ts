import { SuggestModal, type App } from 'obsidian';
import type { OpenQuestion } from '../core/handoff';

/** "Open questions: list" — pick one to jump to it. */
export class OpenQuestionsModal extends SuggestModal<OpenQuestion> {
	constructor(app: App, private readonly items: OpenQuestion[], scope: string) {
		super(app);
		this.setPlaceholder(items.length ? 'Open questions in ' + scope : 'No open questions in ' + scope);
	}

	getSuggestions(query: string): OpenQuestion[] {
		const q = query.toLowerCase();
		return this.items.filter((i) => (i.block.id + ' ' + i.block.title + ' ' + i.path).toLowerCase().includes(q));
	}

	renderSuggestion(item: OpenQuestion, el: HTMLElement): void {
		el.createDiv({ text: item.block.id + ' ' + item.block.title });
		const meta = [item.path, item.block.asked ? 'asked ' + item.block.asked : '', item.block.askedBy ? 'by ' + item.block.askedBy : '']
			.filter(Boolean).join(' · ');
		el.createDiv({ cls: 'keel-open-questions-list-meta', text: meta });
	}

	onChooseSuggestion(item: OpenQuestion): void {
		void this.app.workspace.openLinkText(item.path, '', false, { eState: { line: item.block.lineStart } });
	}
}
