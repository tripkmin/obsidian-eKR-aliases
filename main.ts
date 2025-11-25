import { Notice, Plugin, TFile, TFolder } from "obsidian";
import {
	AliasBatchResult,
	AliasRemoveBatchResult,
	refreshEkrAliasesForFile,
	refreshEkrAliasesForFolder,
	refreshEkrAliasesForVault,
	removeEkrAliasesForFile,
	removeEkrAliasesForFolder,
	removeEkrAliasesForVault,
} from "./src/alias-updater";
import { ConfirmationModal } from "./src/ui/confirmation-modal";

export default class EKRAliasPlugin extends Plugin {
	async onload() {
		this.addRibbonIcon("language", "Refresh eKR aliases", async () => {
			await this.runFileUpdate();
		});

		this.addCommand({
			id: "refresh-ekr-aliases-current-file",
			name: "✅ Refresh eKR aliases (current file)",
			editorCheckCallback: (checking, _editor, ctx) => {
				const targetFile = ctx?.file;
				if (checking) {
					return (
						targetFile instanceof TFile &&
						targetFile.extension === "md"
					);
				}

				void this.runFileUpdate(targetFile as TFile);
			},
		});

		this.addCommand({
			id: "refresh-ekr-aliases-current-folder",
			name: "✅ Refresh eKR aliases (current folder)",
			editorCheckCallback: (checking, _editor, ctx) => {
				const folder = ctx?.file?.parent;
				if (checking) {
					return folder instanceof TFolder && !folder.isRoot();
				}
				if (folder instanceof TFolder) {
					this.createFolderUpdateModal(folder);
				}
			},
		});

		this.addCommand({
			id: "refresh-ekr-aliases-entire-vault",
			name: "✅ Refresh eKR aliases (entire vault)",
			callback: () => {
				this.createVaultUpdateModal();
			},
		});

		this.addCommand({
			id: "remove-ekr-aliases-current-file",
			name: "❌ Remove eKR aliases (current file)",
			editorCheckCallback: (checking, _editor, ctx) => {
				const targetFile = ctx?.file;
				if (checking) {
					return (
						targetFile instanceof TFile &&
						targetFile.extension === "md"
					);
				}

				void this.runFileRemove(targetFile as TFile);
			},
		});

		this.addCommand({
			id: "remove-ekr-aliases-current-folder",
			name: "❌ Remove eKR aliases (current folder)",
			editorCheckCallback: (checking, _editor, ctx) => {
				const folder = ctx?.file?.parent;
				if (checking) {
					return folder instanceof TFolder && !folder.isRoot();
				}
				if (folder instanceof TFolder) {
					this.createFolderRemoveModal(folder);
				}
			},
		});

		this.addCommand({
			id: "remove-ekr-aliases-entire-vault",
			name: "❌ Remove eKR aliases (entire vault)",
			callback: () => {
				this.createVaultRemoveModal();
			},
		});
	}

	private async runFileUpdate(file?: TFile) {
		const targetFile =
			file ??
			(() => {
				const active = this.app.workspace.getActiveFile();
				return active instanceof TFile ? active : null;
			})();

		if (!targetFile) {
			new Notice("활성화된 마크다운 파일이 없습니다.");
			return;
		}

		try {
			const result = await refreshEkrAliasesForFile(this.app, targetFile);
			if (result.added === 0) {
				new Notice("추가할 제목이나 alias가 없습니다.");
				return;
			}
			new Notice(
				`${
					targetFile.basename
				}에 새로운 eKR alias ${result.added.toLocaleString()}개를 추가했습니다.`
			);
		} catch (error) {
			this.handleError(error, targetFile.path);
		}
	}

	private createFolderUpdateModal(folder: TFolder) {
		const startMessage = `"${folder.name}" 폴더의 모든 파일에 eKR alias를 추가합니다. 하위 폴더의 파일도 포함됩니다.`;
		const submitBtnText = `"${folder.name}" 폴더에 eKR alias 추가`;
		const submitBtnNoticeText = `"${folder.name}" 폴더에 eKR alias를 추가하는 중...`;
		new ConfirmationModal(
			this.app,
			startMessage,
			submitBtnText,
			submitBtnNoticeText,
			() => this.runFolderUpdate(folder)
		).open();
	}

	private async runFolderUpdate(folder: TFolder) {
		try {
			const result = await refreshEkrAliasesForFolder(this.app, folder);
			this.displayBatchNotice(
				`폴더 "${folder.path}"`,
				result,
				"폴더에 포함된 마크다운 파일이 없습니다."
			);
		} catch (error) {
			this.handleError(error, folder.path);
		}
	}

	private createVaultUpdateModal() {
		const startMessage =
			"볼트의 모든 파일에 eKR alias를 추가합니다. 이 작업은 시간이 걸릴 수 있습니다.";
		const submitBtnText = "전체 볼트에 eKR alias 추가";
		const submitBtnNoticeText = "전체 볼트에 eKR alias를 추가하는 중...";
		new ConfirmationModal(
			this.app,
			startMessage,
			submitBtnText,
			submitBtnNoticeText,
			() => this.runVaultUpdate()
		).open();
	}

	private async runVaultUpdate() {
		try {
			const result = await refreshEkrAliasesForVault(this.app);
			this.displayBatchNotice(
				"전체 볼트",
				result,
				"볼트에서 처리할 마크다운 파일을 찾지 못했습니다."
			);
		} catch (error) {
			this.handleError(error);
		}
	}

	private async runFileRemove(file: TFile) {
		if (!file) {
			new Notice("활성화된 마크다운 파일이 없습니다.");
			return;
		}

		try {
			const result = await removeEkrAliasesForFile(this.app, file);
			if (result.removed === 0) {
				new Notice("제거할 eKR alias가 없습니다.");
				return;
			}
			new Notice(
				`${
					file.basename
				}에서 eKR alias ${result.removed.toLocaleString()}개를 제거했습니다.`
			);
		} catch (error) {
			this.handleError(error, file.path);
		}
	}

	private createFolderRemoveModal(folder: TFolder) {
		const startMessage = `"${folder.name}" 폴더의 모든 파일에서 eKR alias를 제거합니다. 하위 폴더의 파일도 포함됩니다.`;
		const submitBtnText = `"${folder.name}" 폴더에서 eKR alias 제거`;
		const submitBtnNoticeText = `"${folder.name}" 폴더에서 eKR alias를 제거하는 중...`;
		new ConfirmationModal(
			this.app,
			startMessage,
			submitBtnText,
			submitBtnNoticeText,
			() => this.runFolderRemove(folder)
		).open();
	}

	private async runFolderRemove(folder: TFolder) {
		try {
			const result = await removeEkrAliasesForFolder(this.app, folder);
			this.displayRemoveBatchNotice(
				`폴더 "${folder.path}"`,
				result,
				"폴더에 포함된 마크다운 파일이 없습니다."
			);
		} catch (error) {
			this.handleError(error, folder.path);
		}
	}

	private createVaultRemoveModal() {
		const startMessage =
			"볼트의 모든 파일에서 eKR alias를 제거합니다. 이 작업은 시간이 걸릴 수 있습니다.";
		const submitBtnText = "전체 볼트에서 eKR alias 제거";
		const submitBtnNoticeText = "전체 볼트에서 eKR alias를 제거하는 중...";
		new ConfirmationModal(
			this.app,
			startMessage,
			submitBtnText,
			submitBtnNoticeText,
			() => this.runVaultRemove()
		).open();
	}

	private async runVaultRemove() {
		try {
			const result = await removeEkrAliasesForVault(this.app);
			this.displayRemoveBatchNotice(
				"전체 볼트",
				result,
				"볼트에서 처리할 마크다운 파일을 찾지 못했습니다."
			);
		} catch (error) {
			this.handleError(error);
		}
	}

	private displayBatchNotice(
		scopeLabel: string,
		result: AliasBatchResult,
		emptyMessage: string
	) {
		if (result.filesProcessed === 0) {
			new Notice(emptyMessage);
			return;
		}

		let message = `${scopeLabel} 범위의 ${result.filesUpdated.toLocaleString()}/${result.filesProcessed.toLocaleString()}개 파일에 eKR alias ${result.aliasesAdded.toLocaleString()}개를 추가했습니다.`;

		if (result.errors.length > 0) {
			message += ` (오류 ${result.errors.length}건, 상세 내용은 콘솔을 확인하세요.)`;
			for (const { filePath, message: errorMessage } of result.errors) {
				console.error(
					`[eKR alias updater] ${filePath}: ${errorMessage}`
				);
			}
		}

		new Notice(message);
	}

	private displayRemoveBatchNotice(
		scopeLabel: string,
		result: AliasRemoveBatchResult,
		emptyMessage: string
	) {
		if (result.filesProcessed === 0) {
			new Notice(emptyMessage);
			return;
		}

		let message = `${scopeLabel} 범위의 ${result.filesUpdated.toLocaleString()}/${result.filesProcessed.toLocaleString()}개 파일에서 eKR alias ${result.aliasesRemoved.toLocaleString()}개를 제거했습니다.`;

		if (result.errors.length > 0) {
			message += ` (오류 ${result.errors.length}건, 상세 내용은 콘솔을 확인하세요.)`;
			for (const { filePath, message: errorMessage } of result.errors) {
				console.error(
					`[eKR alias remover] ${filePath}: ${errorMessage}`
				);
			}
		}

		new Notice(message);
	}

	private handleError(error: unknown, filePath?: string) {
		const message =
			error instanceof Error
				? error.message
				: "알 수 없는 오류가 발생했습니다.";
		const prefix = filePath ? `${filePath}: ` : "";
		console.error(`[eKR alias updater] ${prefix}${message}`, error);
		new Notice(`eKR alias 생성에 실패했습니다: ${message}`);
	}
}
