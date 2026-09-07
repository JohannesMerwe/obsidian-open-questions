import { debounce, Notice, Plugin } from 'obsidian';
import { handoffMarkdown, relativeTo } from './core/handoff';
import { Resolver } from './resolver';
import { currentWorkspace, scanOpenQuestions } from './scanner';
import { DEFAULT_SETTINGS, KeelOpenQuestionsSettingTab, type KeelOpenQuestionsSettings } from './settings';
import { OpenQuestionsModal } from './ui/listModal';
import { livePreviewExtension } from './ui/livePreview';
import { readingPostProcessor } from './ui/reading';

export default class KeelOpenQuestionsPlugin extends Plugin {
	declare settings: KeelOpenQuestionsSettings;
	resolver = new Resolver(this.app, () => this.settings);
	private statusBar: HTMLElement | null = null;
	private readonly refreshStatus = debounce(() => void this.updateStatusBar(), 500, true);

	override async onload(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<KeelOpenQuestionsSettings> | null);
		this.addSettingTab(new KeelOpenQuestionsSettingTab(this));
		const settings = () => this.settings;
		this.registerMarkdownPostProcessor(readingPostProcessor(this.app, this.resolver, settings));
		this.registerEditorExtension(livePreviewExtension(this.app, this.resolver, settings));

		this.addCommand({ id: 'list', name: 'Open questions: list', callback: () => void this.listOpenQuestions() });
		this.addCommand({ id: 'copy-handoff', name: 'Open questions: copy handoff', callback: () => void this.copyHandoff() });

		this.app.workspace.onLayoutReady(() => {
			this.onSettingsChanged();
			this.registerEvent(this.app.metadataCache.on('changed', this.refreshStatus));
			this.registerEvent(this.app.vault.on('delete', this.refreshStatus));
			this.registerEvent(this.app.vault.on('rename', this.refreshStatus));
			this.registerEvent(this.app.workspace.on('file-open', this.refreshStatus));
		});
	}

	onSettingsChanged(): void {
		if (this.settings.statusBar && !this.statusBar) {
			this.statusBar = this.addStatusBarItem();
			this.statusBar.addClass('keel-open-questions-status');
			this.registerDomEvent(this.statusBar, 'click', () => void this.listOpenQuestions());
		} else if (!this.settings.statusBar && this.statusBar) {
			this.statusBar.remove();
			this.statusBar = null;
		}
		this.refreshStatus();
	}

	/** The scope of the list, handoff and count: the active note's workspace, else the whole vault. */
	private async scope(): Promise<{ root: string | null; label: string }> {
		const ws = await currentWorkspace(this.app);
		return ws ? { root: ws.root, label: 'workspace ' + ws.name } : { root: null, label: 'the vault' };
	}

	private async listOpenQuestions(): Promise<void> {
		const { root, label } = await this.scope();
		new OpenQuestionsModal(this.app, await scanOpenQuestions(this.app, root), label).open();
	}

	private async copyHandoff(): Promise<void> {
		const { root, label } = await this.scope();
		const items = (await scanOpenQuestions(this.app, root)).map((i) => ({ ...i, path: relativeTo(i.path, root) }));
		await navigator.clipboard.writeText(handoffMarkdown(items));
		new Notice('Copied ' + items.length + ' open ' + (items.length === 1 ? 'question' : 'questions') + ' from ' + label);
	}

	private async updateStatusBar(): Promise<void> {
		if (!this.statusBar) return;
		const { root } = await this.scope();
		const n = (await scanOpenQuestions(this.app, root)).length;
		this.statusBar.setText(n === 0 ? 'No open questions' : n + ' open ' + (n === 1 ? 'question' : 'questions'));
	}
}
