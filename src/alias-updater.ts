import {
	App,
	parseYaml,
	stringifyYaml,
	TAbstractFile,
	TFile,
	TFolder,
	Vault,
} from "obsidian";
import { hangulToDubeolsik } from "./transliterate";

interface FrontmatterParseResult {
	data: Record<string, unknown>;
	body: string;
	hasFrontmatter: boolean;
}

export interface AliasUpdateResult {
	added: number;
}

export interface AliasRemoveResult {
	removed: number;
}

export interface AliasBatchResult {
	filesProcessed: number;
	filesUpdated: number;
	aliasesAdded: number;
	errors: Array<{ filePath: string; message: string }>;
}

export interface AliasRemoveBatchResult {
	filesProcessed: number;
	filesUpdated: number;
	aliasesRemoved: number;
	errors: Array<{ filePath: string; message: string }>;
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const EKR_PREFIX = "(eKR)";

export async function refreshEkrAliases(app: App): Promise<AliasUpdateResult> {
	const file = app.workspace.getActiveFile();
	if (!file) {
		throw new Error("활성화된 마크다운 파일이 없습니다.");
	}

	return refreshEkrAliasesForFile(app, file);
}

export async function refreshEkrAliasesForFile(
	app: App,
	file: TFile
): Promise<AliasUpdateResult> {
	if (file.extension !== "md") {
		throw new Error("마크다운 파일에서만 eKR alias를 생성할 수 있습니다.");
	}

	const noteContent = await app.vault.read(file);
	const { data, body, hasFrontmatter } = parseFrontmatter(noteContent);
	const aliases = normalizeAliases(data.aliases);
	const cleanedAliases = dedupePreserveOrder(
		aliases.filter((alias) => !alias.trimStart().startsWith(EKR_PREFIX))
	);

	const sourceStrings = new Set<string>();
	if (file.basename.trim().length > 0) {
		sourceStrings.add(file.basename);
	}
	for (const alias of cleanedAliases) {
		if (alias.trim().length > 0) {
			sourceStrings.add(alias);
		}
	}

	if (sourceStrings.size === 0) {
		return { added: 0 };
	}

	const ekrAliases = Array.from(sourceStrings).map((original) => {
		const transliterated = hangulToDubeolsik(original);
		return `${EKR_PREFIX} ${original} | ${transliterated}`;
	});

	data.aliases = [...cleanedAliases, ...ekrAliases];

	const newFrontmatter = stringifyYaml(data).trimEnd() + "\n";
	const rebuilt = `---\n${newFrontmatter}---\n${
		hasFrontmatter ? body : noteContent
	}`;

	await app.vault.modify(file, rebuilt);

	return { added: ekrAliases.length };
}

export async function refreshEkrAliasesForFolder(
	app: App,
	folder: TFolder
): Promise<AliasBatchResult> {
	const files = collectMarkdownFiles(app, folder);
	return refreshEkrAliasesAcrossFiles(app, files);
}

export async function refreshEkrAliasesForVault(
	app: App
): Promise<AliasBatchResult> {
	const files = app.vault.getMarkdownFiles();
	return refreshEkrAliasesAcrossFiles(app, files);
}

async function refreshEkrAliasesAcrossFiles(
	app: App,
	files: TFile[]
): Promise<AliasBatchResult> {
	let filesUpdated = 0;
	let aliasesAdded = 0;
	const errors: AliasBatchResult["errors"] = [];

	for (const file of files) {
		try {
			const result = await refreshEkrAliasesForFile(app, file);
			if (result.added > 0) {
				filesUpdated += 1;
				aliasesAdded += result.added;
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			errors.push({ filePath: file.path, message });
		}
	}

	return {
		filesProcessed: files.length,
		filesUpdated,
		aliasesAdded,
		errors,
	};
}

function parseFrontmatter(content: string): FrontmatterParseResult {
	const match = content.match(FRONTMATTER_REGEX);
	if (!match) {
		return {
			data: {},
			body: content,
			hasFrontmatter: false,
		};
	}

	const [, frontmatterRaw] = match;
	const parsed = parseYaml(frontmatterRaw);
	const data =
		parsed && typeof parsed === "object"
			? { ...(parsed as Record<string, unknown>) }
			: {};
	return {
		data,
		body: content.slice(match[0].length),
		hasFrontmatter: true,
	};
}

function normalizeAliases(raw: unknown): string[] {
	if (!raw) {
		return [];
	}

	if (typeof raw === "string") {
		return [raw];
	}

	if (Array.isArray(raw)) {
		return raw
			.filter((value): value is string => typeof value === "string")
			.map((value) => value);
	}

	return [];
}

function dedupePreserveOrder(values: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of values) {
		if (seen.has(value)) {
			continue;
		}
		seen.add(value);
		result.push(value);
	}
	return result;
}

function collectMarkdownFiles(app: App, folder: TFolder): TFile[] {
	const files: TFile[] = [];
	Vault.recurseChildren(folder, (child: TAbstractFile) => {
		if (child instanceof TFile && child.extension === "md") {
			files.push(child);
		}
	});
	return files;
}

export async function removeEkrAliasesForFile(
	app: App,
	file: TFile
): Promise<AliasRemoveResult> {
	if (file.extension !== "md") {
		throw new Error("마크다운 파일에서만 eKR alias를 제거할 수 있습니다.");
	}

	const noteContent = await app.vault.read(file);
	const { data, body, hasFrontmatter } = parseFrontmatter(noteContent);
	const aliases = normalizeAliases(data.aliases);
	const cleanedAliases = dedupePreserveOrder(
		aliases.filter((alias) => !alias.trimStart().startsWith(EKR_PREFIX))
	);

	const removedCount = aliases.length - cleanedAliases.length;

	if (removedCount === 0) {
		return { removed: 0 };
	}

	data.aliases = cleanedAliases.length > 0 ? cleanedAliases : undefined;

	const newFrontmatter = stringifyYaml(data).trimEnd() + "\n";
	const rebuilt = `---\n${newFrontmatter}---\n${
		hasFrontmatter ? body : noteContent
	}`;

	await app.vault.modify(file, rebuilt);

	return { removed: removedCount };
}

export async function removeEkrAliasesForFolder(
	app: App,
	folder: TFolder
): Promise<AliasRemoveBatchResult> {
	const files = collectMarkdownFiles(app, folder);
	return removeEkrAliasesAcrossFiles(app, files);
}

export async function removeEkrAliasesForVault(
	app: App
): Promise<AliasRemoveBatchResult> {
	const files = app.vault.getMarkdownFiles();
	return removeEkrAliasesAcrossFiles(app, files);
}

async function removeEkrAliasesAcrossFiles(
	app: App,
	files: TFile[]
): Promise<AliasRemoveBatchResult> {
	let filesUpdated = 0;
	let aliasesRemoved = 0;
	const errors: AliasRemoveBatchResult["errors"] = [];

	for (const file of files) {
		try {
			const result = await removeEkrAliasesForFile(app, file);
			if (result.removed > 0) {
				filesUpdated += 1;
				aliasesRemoved += result.removed;
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			errors.push({ filePath: file.path, message });
		}
	}

	return {
		filesProcessed: files.length,
		filesUpdated,
		aliasesRemoved,
		errors,
	};
}
