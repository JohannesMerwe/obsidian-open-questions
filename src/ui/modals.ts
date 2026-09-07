import { Modal, Setting, type App } from 'obsidian';

/** Ask for an optional note. Resolves to the note ('' when left empty) or null when cancelled. */
export function askNote(app: App, title: string): Promise<string | null> {
	return new Promise((resolve) => new NoteModal(app, title, resolve).open());
}

/** Ask for a free-text answer and an optional note. Resolves null when cancelled. */
export function askOther(app: App, title: string): Promise<{ text: string; note: string } | null> {
	return new Promise((resolve) => new OtherModal(app, title, resolve).open());
}

class NoteModal extends Modal {
	private note = '';
	private done = false;

	constructor(app: App, private readonly title: string, private readonly resolve: (v: string | null) => void) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.title);
		new Setting(this.contentEl)
			.setName('Note')
			.setDesc('Optional. Kept in the decision block.')
			.addText((t) => {
				t.setPlaceholder('Why, or what to watch for').onChange((v) => (this.note = v));
				t.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submit(); });
				window.setTimeout(() => t.inputEl.focus(), 0);
			});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Decide').setCta().onClick(() => this.submit()))
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
	}

	private submit(): void {
		this.done = true;
		this.resolve(this.note.trim());
		this.close();
	}

	override onClose(): void {
		if (!this.done) this.resolve(null);
		this.contentEl.empty();
	}
}

class OtherModal extends Modal {
	private text = '';
	private note = '';
	private done = false;

	constructor(app: App, private readonly title: string, private readonly resolve: (v: { text: string; note: string } | null) => void) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.title);
		new Setting(this.contentEl)
			.setName('Your answer')
			.setDesc('Recorded as the chosen option.')
			.addText((t) => {
				t.onChange((v) => (this.text = v));
				t.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submit(); });
				window.setTimeout(() => t.inputEl.focus(), 0);
			});
		new Setting(this.contentEl)
			.setName('Note')
			.setDesc('Optional.')
			.addText((t) => {
				t.onChange((v) => (this.note = v));
				t.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submit(); });
			});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Decide').setCta().onClick(() => this.submit()))
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()));
	}

	private submit(): void {
		if (!this.text.trim()) return;
		this.done = true;
		this.resolve({ text: this.text.trim(), note: this.note.trim() });
		this.close();
	}

	override onClose(): void {
		if (!this.done) this.resolve(null);
		this.contentEl.empty();
	}
}
