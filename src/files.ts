import { TFile, type App } from 'obsidian';
import type { VaultFiles } from './core/workspace';

/**
 * A synchronous `VaultFiles` over the vault for the core resolvers. Existence is answered
 * live; contents come from a snapshot read up front for the paths the caller may need.
 */
export async function snapshotFiles(app: App, candidates: Iterable<string>): Promise<VaultFiles> {
	const contents = new Map<string, string>();
	for (const path of new Set(candidates)) {
		const file = app.vault.getFileByPath(path);
		if (file) contents.set(path, await app.vault.cachedRead(file));
	}
	return {
		exists: (path) => app.vault.getFileByPath(path) instanceof TFile,
		read: (path) => contents.get(path) ?? null,
	};
}
