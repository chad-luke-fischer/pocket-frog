import species from "../species.js";

export const PALETTE = Object.freeze(/** @type {const} */ ({
	TRANSPARENT: "transparent",
	OUTLINE: "outline",
	BORDER: "border",
	BODY: "body",
	BELLY: "belly",
	UNDERBELLY: "underbelly",
	SPOTS: "spots",
	EYE_RING: "eye-ring",
	EYE: "eye",
	MOUTH: "mouth",
	WEBBING: "webbing",
	FOOT: "foot",
	THEME_HIGHLIGHT: "theme-highlight",
	HEART: "heart",
	HEART_BORDER: "heart-border",
	HEART_SHINE: "heart-shine",
}));

/** @typedef {typeof PALETTE[keyof typeof PALETTE]} PaletteColor */

export const RARITY = Object.freeze(/** @type {const} */ ({
	COMMON: "common",
	UNCOMMON: "uncommon",
	RARE: "rare",
}));

/** @typedef {typeof RARITY[keyof typeof RARITY]} Rarity */

const FIXED_COLORS = {
	[PALETTE.TRANSPARENT]: "transparent",
	[PALETTE.OUTLINE]: "#1a1a1a",
	[PALETTE.BORDER]: "#ffffff",
	[PALETTE.HEART]: "#c82e2e",
	[PALETTE.HEART_BORDER]: "#501a1a",
	[PALETTE.HEART_SHINE]: "#ff6b6b",
};

const REQUIRED_COLOR_KEYS = [
	PALETTE.BODY,
	PALETTE.BELLY,
	PALETTE.UNDERBELLY,
	PALETTE.EYE_RING,
	PALETTE.EYE,
	PALETTE.MOUTH,
	PALETTE.WEBBING,
	PALETTE.FOOT,
];

export class FrogType {
	/**
	 * @param {string} id
	 * @param {string} name
	 * @param {string} description
	 * @param {string} latinName
	 * @param {string} url
	 * @param {Record<string, string>} colors
	 * @param {string[]} [tags]
	 * @param {Rarity} [rarity]
	 */
	constructor(id, name, description, latinName, url, colors, tags = [], rarity = RARITY.COMMON) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.latinName = latinName;
		this.url = url;
		this.tags = tags;
		this.rarity = rarity;
		const defaults = {
			...FIXED_COLORS,
			[PALETTE.SPOTS]: colors.spots ?? colors.body,
			[PALETTE.THEME_HIGHLIGHT]: colors["theme-highlight"] ?? colors.body,
		};
		/** @type {Record<string, string>} */
		this.colors = { ...defaults, ...colors };
	}

	/**
	 * Sanity-check that all required palette slots are present.
	 * @returns {string[]} List of missing palette slot names.
	 */
	missingColorKeys() {
		return REQUIRED_COLOR_KEYS.filter((k) => !this.colors[k]);
	}
}

/** @type {Record<string, FrogType>} */
export const SPECIES = Object.fromEntries(
	Object.entries(species).map(([id, data]) => [
		id,
		new FrogType(id, data.name, data.description, data.latinName, data.url, data.colors, data.tags, data.rarity),
	])
);
