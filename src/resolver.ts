import { Notice, type App } from 'obsidian';
import { questions, resolveInText, tickedResolution, type Chosen, type DecisionBlock } from './core/blocks';
import { isoDate } from './core/dates';
import { appendLogLine, formatLogLine, resolveLogTarget, resolvePath } from './core/log';
import { ancestors, dirname, findWorkspace, join } from './core/workspace';
import { snapshotFiles } from './files';
import type { KeelOpenQuestionsSettings } from './settings';
import { FALLBACK_NAME } from './settings';

/** Performs the C2 rewrite and log append against the vault. */
export class Resolver {
	constructor(private readonly app: App, private readonly settings: () => KeelOpenQuestionsSettings) {}

	/** Rewrite question `id` in `path` into a decision, then append the log line. */
	async resolve(path: string, id: string, chosen: Chosen[], note: string | null): Promise<void> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) { new Notice('Note not found: ' + path); return; }
		const decided = isoDate(new Date());
		const decidedBy = this.settings().decidedBy.trim() || FALLBACK_NAME;
		let decision: DecisionBlock | null = null;
		let log: string | null = null;
		await this.app.vault.process(file, (text) => {
			const q = questions(text).find((b) => b.id === id);
			const r = q && resolveInText(text, id, { chosen, decided, decidedBy, note });
			if (!q || !r) return text;
			decision = r.decision;
			log = q.log;
			return r.text;
		});
		if (!decision) { new Notice(id + ' is no longer a question in ' + file.basename); return; }
		const target = await this.appendLog(path, decision, log, decided);
		new Notice(id + ' decided: ' + chosen.map((c) => c.text).join(', ') + (target ? '. Logged in ' + target : ''));
	}

	/** Turn ticked boxes (an answer given without the plugin) into the decision block and log line. */
	async recordTicked(path: string, id: string): Promise<void> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) return;
		const text = await this.app.vault.cachedRead(file);
		const q = questions(text).find((b) => b.id === id);
		const r = q && tickedResolution(q, isoDate(new Date()), this.settings().decidedBy.trim() || FALLBACK_NAME);
		if (!r) { new Notice('Nothing is ticked in ' + id); return; }
		await this.resolve(path, id, r.chosen, null);
	}

	private async appendLog(notePath: string, decision: DecisionBlock, log: string | null, date: string): Promise<string | null> {
		const candidates = ancestors(notePath).flatMap((dir) => [join(dir, 'keel.json'), join(dir, 'INDEX.md')]);
		if (log) candidates.push(resolvePath(dirname(notePath), log.split('#')[0] ?? ''));
		const files = await snapshotFiles(this.app, candidates);
		const workspace = findWorkspace(notePath, files);
		const target = resolveLogTarget(notePath, log, files, workspace ? workspace.root : null);
		if (!target) return null;
		const line = formatLogLine(decision, notePath, date);
		const existing = this.app.vault.getFileByPath(target.path);
		if (existing) {
			await this.app.vault.process(existing, (text) => appendLogLine(text, target.anchor, line));
		} else {
			const heading = target.anchor ? '## ' + target.anchor.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) + '\n\n' : '';
			await this.app.vault.create(target.path, heading + line + '\n');
		}
		return target.path;
	}
}
