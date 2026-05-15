/** @typedef {Object} SpeciesData
 * @property {string} name
 * @property {string} description
 * @property {string} latinName
 * @property {string} url
 * @property {Record<string, string>} colors
 * @property {string[]} [tags]
 * @property {string} [rarity]
 */

/** @type {Record<string, SpeciesData>} */
const species = {
	greenTreeFrog: {
		name: "American Green Tree Frog",
		description: "A bright green amphibian native to the southeastern United States. Often heard chirping from windowsills on summer nights.",
		latinName: "Hyla cinerea",
		url: "https://en.wikipedia.org/wiki/American_green_tree_frog",
		colors: {
			body: "#5fbf3f",
			belly: "#f4f0d4",
			underbelly: "#d8d2a8",
			"eye-ring": "#3a8a26",
			eye: "#1a1a1a",
			mouth: "#2a4a1a",
			webbing: "#9fcf78",
			foot: "#3a8a26",
			"theme-highlight": "#86d35a",
		},
	},
	redEyedTreeFrog: {
		name: "Red-Eyed Tree Frog",
		description: "Native to Central American rainforests, this frog flashes its scarlet eyes to startle predators before bounding away.",
		latinName: "Agalychnis callidryas",
		url: "https://en.wikipedia.org/wiki/Red-eyed_tree_frog",
		colors: {
			body: "#3fbf5f",
			belly: "#f6efb8",
			underbelly: "#dec88a",
			"eye-ring": "#e22b2b",
			eye: "#1a1a1a",
			mouth: "#1a3a18",
			webbing: "#f08a3a",
			foot: "#d96a1a",
			"theme-highlight": "#e22b2b",
		},
		tags: ["spots"],
	},
	bluePoisonDartFrog: {
		name: "Blue Poison Dart Frog",
		description: "Found only in southern Suriname, these striking blue frogs warn would-be predators of their potent skin alkaloids.",
		latinName: "Dendrobates tinctorius",
		url: "https://en.wikipedia.org/wiki/Dendrobates_tinctorius",
		colors: {
			body: "#3a78d6",
			belly: "#1f4a92",
			underbelly: "#15366e",
			spots: "#0e1f3e",
			"eye-ring": "#0e1f3e",
			eye: "#1a1a1a",
			mouth: "#0e1f3e",
			webbing: "#5a8fe0",
			foot: "#1f4a92",
			"theme-highlight": "#5fa8ff",
		},
		tags: ["spots"],
		rarity: "uncommon",
	},
};

export default species;
