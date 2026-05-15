import { log } from "./shared.js";

export const SAVE_KEY = "frogSaveData";
const ROOT_PATH = "";
const MONOCRAFT_URL = "__MONOCRAFT_URL__";

/**
 * @typedef {import('./application.js').FrogSaveData} FrogSaveData
 */

/**
 * @abstract
 */
export class Context {
	/** @returns {Promise<Partial<FrogSaveData>>} */
	async getSaveData() { throw new Error("not implemented"); }

	/** @param {FrogSaveData} _saveData */
	async putSaveData(_saveData) { throw new Error("not implemented"); }

	resetSaveData() { throw new Error("not implemented"); }

	getPath() { return window.location.href; }

	getActivePage() { return document.documentElement; }

	/** @returns {string} */
	getFontStyles() {
		return `@font-face { font-family: 'Monocraft'; src: url("${MONOCRAFT_URL}") format('opentype'); font-weight: normal; font-style: normal; }`;
	}
}

export class ObsidianContext extends Context {
	/**
	 * @override
	 * @returns {Promise<Partial<FrogSaveData>>}
	 */
	async getSaveData() {
		log("Loading save data from Obsidian plugin storage");
		// @ts-expect-error OBSIDIAN_PLUGIN injected by wrapper
		const data = await OBSIDIAN_PLUGIN.loadData();
		return data ?? {};
	}

	/**
	 * @override
	 * @param {FrogSaveData|{}} saveData
	 */
	async putSaveData(saveData) {
		// @ts-expect-error
		await OBSIDIAN_PLUGIN.saveData(saveData);
	}

	/** @override */
	resetSaveData() {
		this.putSaveData({});
	}

	/** @override */
	getPath() {
		// @ts-expect-error
		const file = app.workspace.getActiveFile();
		if (file && this.getActiveEditorElement()) {
			return file.path;
		}
		return ROOT_PATH;
	}

	/** @override */
	getActivePage() {
		if (this.getPath() === ROOT_PATH) return document.documentElement;
		return this.getActiveEditorElement() ?? document.documentElement;
	}

	/** @returns {HTMLElement|null} */
	getActiveEditorElement() {
		// @ts-expect-error
		const activeLeaf = app.workspace.activeLeaf;
		const leafElement = activeLeaf?.view?.containerEl;
		return leafElement?.querySelector(".cm-scroller") ?? null;
	}
}
