import { Plugin } from 'obsidian';
import { Resolver } from './resolver';
import { DEFAULT_SETTINGS, KeelOpenQuestionsSettingTab, type KeelOpenQuestionsSettings } from './settings';
import { livePreviewExtension } from './ui/livePreview';
import { readingPostProcessor } from './ui/reading';

export default class KeelOpenQuestionsPlugin extends Plugin {
	declare settings: KeelOpenQuestionsSettings;
	resolver = new Resolver(this.app, () => this.settings);

	override async onload(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<KeelOpenQuestionsSettings> | null);
		this.addSettingTab(new KeelOpenQuestionsSettingTab(this));
		const settings = () => this.settings;
		this.registerMarkdownPostProcessor(readingPostProcessor(this.app, this.resolver, settings));
		this.registerEditorExtension(livePreviewExtension(this.app, this.resolver, settings));
	}

	onSettingsChanged(): void {
		// Status bar and commands (KQ-3) react here.
	}
}
