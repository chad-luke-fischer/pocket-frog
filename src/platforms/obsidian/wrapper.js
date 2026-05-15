const { Plugin, PluginSettingTab, Setting, Notice, TextAreaComponent, requestUrl } = require('obsidian');

class PocketFrogSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Pocket Frog' });

		const api = await this.plugin.getFrogAPI();
		const settings = api.getSettings();
		let apiKey = settings.apiKey || '';
		let lastDescription = '';
		/** @type {any} */
		let lastResult = null;

		new Setting(containerEl)
			.setName('Anthropic API key')
			.setDesc('Stored locally in this plugin\'s data file. Used only to generate new frog species. Get one at console.anthropic.com.')
			.addText(text => {
				text.inputEl.type = 'password';
				text.setPlaceholder('sk-ant-...');
				text.setValue(apiKey);
				text.onChange(async (v) => {
					apiKey = v.trim();
					await api.updateSettings({ apiKey });
				});
			});

		new Setting(containerEl)
			.setName('Frog visibility')
			.setDesc('Hide the frog without unloading the plugin.')
			.addToggle(t => {
				t.setValue(settings.visible !== false);
				t.onChange(async (v) => api.updateSettings({ visible: v }));
			});

		containerEl.createEl('h3', { text: 'Generate a frog with Claude' });
		const desc = containerEl.createEl('p', {
			text: 'Describe a frog and Claude will design its pixel-art palette. Examples: "an iridescent rainforest frog with golden eyes", "a frosty arctic frog with deep blue spots".',
		});
		desc.style.fontSize = '12px';
		desc.style.color = 'var(--text-muted)';

		const inputContainer = containerEl.createDiv();
		const ta = new TextAreaComponent(inputContainer);
		ta.setPlaceholder('A sunset-coloured frog with a faint glow on its belly...');
		ta.inputEl.style.width = '100%';
		ta.inputEl.style.minHeight = '70px';
		ta.onChange((v) => { lastDescription = v; });

		const previewBox = containerEl.createDiv();
		previewBox.style.marginTop = '12px';
		previewBox.style.minHeight = '60px';

		const buttonRow = containerEl.createDiv();
		buttonRow.style.display = 'flex';
		buttonRow.style.gap = '8px';
		buttonRow.style.marginTop = '8px';

		const genButton = buttonRow.createEl('button', { text: 'Generate' });
		const addButton = buttonRow.createEl('button', { text: 'Add to my collection' });
		addButton.disabled = true;

		genButton.addEventListener('click', async () => {
			if (!apiKey) { new Notice('Set your Anthropic API key first.'); return; }
			if (!lastDescription.trim()) { new Notice('Describe the frog you want.'); return; }
			genButton.disabled = true;
			previewBox.empty();
			previewBox.createEl('div', { text: 'Asking Claude...' });
			try {
				lastResult = await api.generateSpecies(apiKey, lastDescription);
				renderPreview(previewBox, lastResult, api);
				addButton.disabled = false;
			} catch (e) {
				previewBox.empty();
				const msg = previewBox.createEl('div', { text: 'Generation failed: ' + (e.message || String(e)) });
				msg.style.color = 'var(--text-error)';
				addButton.disabled = true;
			} finally {
				genButton.disabled = false;
			}
		});

		addButton.addEventListener('click', async () => {
			if (!lastResult) return;
			const id = 'custom_' + (lastResult.name || 'frog').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 32) + '_' + Date.now().toString(36).slice(-4);
			await api.addCustomSpecies({ ...lastResult, id });
			new Notice(`Added ${lastResult.name} to your Field Guide.`);
			addButton.disabled = true;
		});

		containerEl.createEl('h3', { text: 'Your custom species' });
		const customList = containerEl.createDiv();
		const custom = api.getCustomSpecies();
		if (custom.length === 0) {
			customList.createEl('p', { text: 'No custom species yet.' }).style.color = 'var(--text-muted)';
		} else {
			for (const c of custom) {
				const row = customList.createDiv();
				row.style.padding = '4px 0';
				row.style.borderBottom = '1px solid var(--background-modifier-border)';
				row.createEl('strong', { text: c.name });
				row.createEl('span', { text: ` (${c.latinName})` }).style.color = 'var(--text-muted)';
			}
		}
	}
}

/**
 * @param {HTMLElement} container
 * @param {any} species
 * @param {any} api
 */
function renderPreview(container, species, api) {
	container.empty();
	const wrapper = container.createDiv();
	wrapper.style.display = 'flex';
	wrapper.style.gap = '12px';
	wrapper.style.alignItems = 'flex-start';

	const canvas = document.createElement('canvas');
	canvas.width = 96;
	canvas.height = 96;
	canvas.style.imageRendering = 'pixelated';
	canvas.style.background = 'var(--background-secondary)';
	canvas.style.border = '1px solid var(--background-modifier-border)';
	wrapper.appendChild(canvas);
	api.renderSpeciesPreview(canvas, species);

	const info = wrapper.createDiv();
	info.createEl('strong', { text: species.name });
	info.createEl('div', { text: species.latinName }).style.fontStyle = 'italic';
	info.createEl('div', { text: species.description }).style.marginTop = '6px';
	info.createEl('div', { text: 'Rarity: ' + species.rarity }).style.color = 'var(--text-muted)';
}

module.exports = class PocketFrog extends Plugin {
	async onload() {
		console.log("Loading Pocket Frog version __VERSION__...");
		// eslint-disable-next-line no-unused-vars
		const OBSIDIAN_PLUGIN = this;
		// Inject Obsidian's CORS-bypassing HTTP client for the Claude generator.
		// @ts-ignore
		window.__pocketFrogHttp__ = requestUrl;
		// Bundled plugin code (defines window.__pocketFrogAPI__):
		__CODE__
		this.addSettingTab(new PocketFrogSettingTab(this.app, this));
		console.log("Pocket Frog loaded!");
	}

	async getFrogAPI() {
		// @ts-ignore
		while (!window.__pocketFrogAPI__) {
			await new Promise(r => setTimeout(r, 50));
		}
		// @ts-ignore
		return window.__pocketFrogAPI__;
	}

	onunload() {
		document.getElementById('pocket-frog-host')?.remove();
		// @ts-ignore
		try { window.__pocketPets__?.unregister?.('frog-main'); } catch (_) {}
		// @ts-ignore
		delete window.__pocketFrogAPI__;
		console.log('Pocket Frog unloaded!');
	}
};
