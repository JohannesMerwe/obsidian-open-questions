import { PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type KeelOpenQuestionsPlugin from './main';

export interface KeelOpenQuestionsSettings {
	/** Name written after `decided: … · by:` and into the log. */
	decidedBy: string;
	/** Ask for an optional note before writing the decision. */
	askNote: boolean;
	/** Show the open-question count in the status bar. */
	statusBar: boolean;
}

export const DEFAULT_SETTINGS: KeelOpenQuestionsSettings = {
	decidedBy: '',
	askNote: true,
	statusBar: true,
};

export const FALLBACK_NAME = 'owner';

export class KeelOpenQuestionsSettingTab extends PluginSettingTab {
	constructor(private readonly keelPlugin: KeelOpenQuestionsPlugin) {
		super(keelPlugin.app, keelPlugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Your name on decisions',
				desc: 'Written as "decided by" in the decision block and its log line.',
				control: { type: 'text', key: 'decidedBy', placeholder: FALLBACK_NAME },
			},
			{
				name: 'Ask for a note when deciding',
				desc: 'Offer an optional free-text note before the block is rewritten. "Other…" always asks.',
				control: { type: 'toggle', key: 'askNote', defaultValue: DEFAULT_SETTINGS.askNote },
			},
			{
				name: 'Show open questions in the status bar',
				desc: 'A count of unanswered questions in the current workspace, or the whole vault outside one.',
				control: { type: 'toggle', key: 'statusBar', defaultValue: DEFAULT_SETTINGS.statusBar },
			},
		];
	}

	override async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
		this.keelPlugin.onSettingsChanged();
	}
}
