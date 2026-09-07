import { EditorState, StateField, type Extension, type Transaction } from '@codemirror/state';
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';
import { editorInfoField, editorLivePreviewField, type App } from 'obsidian';
import { questions, serialiseQuestion, type QuestionBlock } from '../core/blocks';
import type { Resolver } from '../resolver';
import type { KeelOpenQuestionsSettings } from '../settings';
import { attachControls } from './actions';

/** Live preview: a block widget with the button row under every question block. Source mode shows nothing. */
export function livePreviewExtension(app: App, resolver: Resolver, settings: () => KeelOpenQuestionsSettings): Extension {
	class QuestionWidget extends WidgetType {
		constructor(private readonly q: QuestionBlock, private readonly path: string) {
			super();
		}

		override eq(other: QuestionWidget): boolean {
			return other.path === this.path && serialiseQuestion(other.q) === serialiseQuestion(this.q);
		}

		override toDOM(): HTMLElement {
			const el = createDiv({ cls: 'keel-open-questions-widget' });
			attachControls(el, this.q, this.path, app, resolver, settings);
			return el;
		}

		override ignoreEvent(): boolean {
			return true;
		}
	}

	function build(state: EditorState): DecorationSet {
		if (!state.field(editorLivePreviewField, false)) return Decoration.none;
		const path = state.field(editorInfoField, false)?.file?.path;
		if (!path) return Decoration.none;
		const doc = state.doc;
		const ranges = questions(doc.toString()).filter((q) => q.lineEnd < doc.lines).map((q) =>
			Decoration.widget({ widget: new QuestionWidget(q, path), block: true, side: 1 }).range(doc.line(q.lineEnd + 1).to),
		);
		return Decoration.set(ranges, true);
	}

	function modeChanged(tr: Transaction): boolean {
		return tr.startState.field(editorLivePreviewField, false) !== tr.state.field(editorLivePreviewField, false);
	}

	const field = StateField.define<DecorationSet>({
		create: build,
		update: (value, tr) => (tr.docChanged || modeChanged(tr) ? build(tr.state) : value),
		provide: (f) => EditorView.decorations.from(f),
	});
	return [field];
}
