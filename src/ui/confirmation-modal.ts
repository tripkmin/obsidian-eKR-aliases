import { Notice, Modal, App } from "obsidian";

export class ConfirmationModal extends Modal {
	constructor(
		app: App,
		startModalMessageText: string,
		submitBtnText: string,
		submitBtnNoticeText: string,
		btnSubmitAction: () => Promise<void>
	) {
		super(app);
		this.modalEl.addClass("confirm-modal");

		this.contentEl.createEl("h3", {
			text: "경고",
			cls: "modal-heading",
		});

		this.contentEl.createEl("p", {
			text: startModalMessageText + " 파일을 백업했는지 확인하세요.",
		}).id = "confirm-dialog";

		this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
			buttonsEl
				.createEl("button", { text: "취소" })
				.addEventListener("click", () => this.close());

			const btnSubmit = buttonsEl.createEl("button", {
				attr: { type: "submit" },
				cls: "mod-cta",
				text: submitBtnText,
			});
			btnSubmit.addEventListener("click", async (_e) => {
				new Notice(submitBtnNoticeText);
				this.close();
				await btnSubmitAction();
			});
			setTimeout(() => {
				btnSubmit.focus();
			}, 50);
		});
	}
}

