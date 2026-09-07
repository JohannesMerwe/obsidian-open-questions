import type { App } from 'obsidian';
import { openQuestions } from './core/blocks';
import { withinRoot, type OpenQuestion } from './core/handoff';
import { ancestors, findWorkspace, join, type Workspace } from './core/workspace';
import { snapshotFiles } from './files';

/** Contract C1 for the note in the active view: its workspace, or null in plain mode. */
export async function currentWorkspace(app: App): Promise<Workspace | null> {
	const path = app.workspace.getActiveFile()?.path;
	if (!path) return null;
	const files = await snapshotFiles(app, ancestors(path).map((dir) => join(dir, 'keel.json')));
	return findWorkspace(path, files);
}

/** Every unanswered question block under `root` ('' or null for the whole vault), in path order. */
export async function scanOpenQuestions(app: App, root: string | null): Promise<OpenQuestion[]> {
	const out: OpenQuestion[] = [];
	const files = app.vault.getMarkdownFiles().filter((f) => withinRoot(f.path, root)).sort((a, b) => a.path.localeCompare(b.path));
	for (const file of files) {
		const sections = app.metadataCache.getFileCache(file)?.sections;
		if (sections && !sections.some((s) => s.type === 'callout')) continue;
		const text = await app.vault.cachedRead(file);
		if (!text.includes('[!question]')) continue;
		for (const block of openQuestions(text)) out.push({ path: file.path, block });
	}
	return out;
}
