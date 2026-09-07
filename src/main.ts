import { Notice, Plugin } from 'obsidian';

export default class KeelOpenQuestionsPlugin extends Plugin {
	onload(): void {
		this.addCommand({
			id: 'status',
			name: 'Show status',
			callback: () => {
				new Notice('Keel Open Questions ' + this.manifest.version + ' is loaded. Nothing to show yet.');
			},
		});
	}
}
