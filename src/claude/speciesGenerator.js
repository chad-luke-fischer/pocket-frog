import { PALETTE } from "../animation/sprites.js";

const MODEL = "claude-opus-4-7";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SYSTEM_PROMPT = `You are a pixel-art frog species designer for an Obsidian plugin called Pocket Frog.

Output ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "name": "Common Name (e.g. Sunset Spire Frog)",
  "latinName": "Plausible binomial (italicizable)",
  "description": "1-2 sentence naturalist-tone description",
  "rarity": "common" | "uncommon" | "rare",
  "tags": ["spots"]?,
  "colors": {
    "body": "#hex6",
    "belly": "#hex6",
    "underbelly": "#hex6",
    "spots": "#hex6 (optional, only if tags includes 'spots')",
    "eye-ring": "#hex6",
    "eye": "#hex6",
    "mouth": "#hex6",
    "webbing": "#hex6",
    "foot": "#hex6",
    "theme-highlight": "#hex6 (optional)"
  }
}

Color guidance:
- All hex codes are 6-digit lowercase (e.g. "#ff7700"), no shorthand.
- Pick colors that read well at 32x32 with hard pixel edges.
- Belly should contrast with body so the frog reads as a frog.
- "spots" only matters if you set tags=["spots"]; otherwise omit.
- "underbelly" is a slightly darker shade of "belly" for shading.
- "eye-ring" is the iris/outer eye; "eye" is the pupil (usually near-black).
- "mouth" is a thin line; usually a darkened body color.`;

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
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const VALID_RARITIES = new Set(["common", "uncommon", "rare"]);

/**
 * @typedef {Object} GeneratedSpecies
 * @property {string} name
 * @property {string} latinName
 * @property {string} description
 * @property {"common"|"uncommon"|"rare"} rarity
 * @property {string[]} [tags]
 * @property {Record<string, string>} colors
 */

/**
 * @typedef {Object} HttpResponse
 * @property {number} status
 * @property {string} [text]
 * @property {any} [json]
 */

/**
 * Generate a frog species via Claude.
 *
 * @param {string} apiKey
 * @param {string} description
 * @param {(opts: {url: string, method: string, headers: Record<string,string>, body: string, throw?: boolean}) => Promise<HttpResponse>} httpPost
 *   Inject Obsidian's `requestUrl` (which bypasses CORS in the renderer).
 * @returns {Promise<GeneratedSpecies>}
 */
export async function generate(apiKey, description, httpPost) {
	if (!apiKey) throw new Error("Anthropic API key is required");
	if (!description || !description.trim()) throw new Error("Description is required");
	if (typeof httpPost !== "function") throw new Error("HTTP client not provided");

	const body = JSON.stringify({
		model: MODEL,
		max_tokens: 1024,
		system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
		messages: [{ role: "user", content: `Description: ${description.trim()}` }],
	});

	const resp = await httpPost({
		url: ANTHROPIC_API_URL,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": ANTHROPIC_VERSION,
		},
		body,
		throw: false,
	});

	if (resp.status !== 200) {
		const errBody = resp.text ?? (resp.json ? JSON.stringify(resp.json) : "");
		throw new Error(`Anthropic API ${resp.status}: ${errBody.slice(0, 400)}`);
	}

	const data = resp.json ?? JSON.parse(resp.text ?? "{}");
	const block = (data.content || []).find(/** @param {any} b */ (b) => b.type === "text");
	if (!block) throw new Error("Claude returned no text content");

	const raw = String(block.text).trim();
	const jsonText = stripJsonFences(raw);
	let parsed;
	try {
		parsed = JSON.parse(jsonText);
	} catch (e) {
		throw new Error(`Claude returned invalid JSON: ${/** @type {Error} */ (e).message}\n\nRaw: ${raw.slice(0, 400)}`);
	}
	validate(parsed);
	return parsed;
}

/** @param {string} txt */
function stripJsonFences(txt) {
	const m = txt.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
	return m ? m[1] : txt;
}

/** @param {any} s */
function validate(s) {
	if (!s || typeof s !== "object") throw new Error("Response is not an object");
	for (const k of ["name", "latinName", "description", "rarity", "colors"]) {
		if (!s[k]) throw new Error(`Missing required field: ${k}`);
	}
	if (!VALID_RARITIES.has(s.rarity)) throw new Error(`Invalid rarity: ${s.rarity}`);
	if (typeof s.colors !== "object") throw new Error("colors must be an object");
	for (const k of REQUIRED_COLOR_KEYS) {
		const v = s.colors[k];
		if (typeof v !== "string" || !HEX_RE.test(v)) {
			throw new Error(`colors.${k} must be a 6-digit hex (#rrggbb), got: ${JSON.stringify(v)}`);
		}
	}
	if (s.tags && !Array.isArray(s.tags)) throw new Error("tags must be an array if present");
}
