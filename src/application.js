import { Directions, getShadowRoot, setShadowRoot, setContext, log, error, makeElement, onClick } from "./shared.js";
import { Frog, Animations } from "./frog.js";
import { SPECIES, FrogType } from "./animation/sprites.js";
import { FROG_SPRITE, SPRITE_HEIGHT } from "./animation/spriteData.js";
import Frame from "./animation/frame.js";
import Layer from "./animation/layer.js";
import { Context } from "./context.js";
import { openMenu, closeMenu, isMenuOpen } from "./menu.js";
import { getBus, syncPhantomBird } from "./interop/petBus.js";
import { generate as generateSpeciesViaClaude } from "./claude/speciesGenerator.js";

/**
 * @typedef {Object} FrogSettings
 * @property {string} [apiKey]
 * @property {boolean} [visible]
 * @property {number} [scaleMultiplier]
 */

/**
 * @typedef {Object} CustomSpecies
 * @property {string} id
 * @property {string} name
 * @property {string} latinName
 * @property {string} description
 * @property {string} rarity
 * @property {string[]} [tags]
 * @property {Record<string, string>} colors
 */

/**
 * @typedef {Object} FrogSaveData
 * @property {string[]} unlockedSpecies
 * @property {string} currentSpecies
 * @property {CustomSpecies[]} customSpecies
 * @property {FrogSettings} settings
 */

const STYLESHEET = `___STYLESHEET___`;

const DEFAULT_SPECIES = "greenTreeFrog";
const CANVAS_PIXEL_SIZE = 2;
const FROG_BOTTOM_MARGIN = 24;

const UPDATE_INTERVAL = 1000 / 60;
const HOP_CHANCE = 1 / (60 * 3.5);     // every ~3.5s when STILL
const HOP_DISTANCE = 60;               // px per hop
const HOP_DURATION = 310;              // ms - matches JUMP_ARC total (80+120+80+30)
const HOP_PEAK_HEIGHT = 28;            // px - sine arc peak
const HEART_DURATION = 1500;
const PET_SWEEP_WINDOW = 1500;         // ms
const PET_SWEEP_THRESHOLD = 4;
const NEAR_PET_DIST = 200;
const VERY_NEAR_PET_DIST = 100;
const HOP_TOWARD_PET_DELAY = 3000;     // ms idle before reacting
const PET_BUS_PUBLISH_INTERVAL = 100;  // ms
const PHANTOM_BIRD_POLL_INTERVAL = 500;// ms

const FROG_BUS_ID = "frog-main";

/** @type {Frog} */
let frog;
/** @type {Context} */
let context;
/** @type {FrogSaveData} */
let save;
/** @type {Record<string, FrogType>} */
let allSpecies;

let hopState = /** @type {null | { startX: number, targetX: number, startedAt: number }} */ (null);
let lastPetSweeps = /** @type {{ts: number, dir: number}[]} */ ([]);
let lastMouseX = -1;
let lastSweepDir = 0;
let stillSince = Date.now();
let lastBusPublish = 0;
let lastPhantomPoll = 0;

/** @param {Context} ctx */
export async function initializeApplication(ctx) {
	log("Pocket Frog booting...");
	setContext(ctx);
	context = ctx;

	save = await loadSaveData();
	allSpecies = buildSpeciesRegistry(save.customSpecies);

	const host = document.createElement("div");
	host.id = "pocket-frog-host";
	host.style.position = "fixed";
	host.style.inset = "0";
	host.style.pointerEvents = "none";
	host.style.zIndex = "99999";
	document.body.appendChild(host);

	const shadow = host.attachShadow({ mode: "open" });
	setShadowRoot(shadow);

	const styleEl = document.createElement("style");
	styleEl.textContent = ctx.getFontStyles() + "\n" + STYLESHEET;
	shadow.appendChild(styleEl);

	frog = new Frog(CANVAS_PIXEL_SIZE);
	frog.setX(140);
	frog.setY(FROG_BOTTOM_MARGIN);
	frog.setVisible(save.settings.visible !== false);

	getBus().register(FROG_BUS_ID, {
		species: "frog",
		x: frog.getX(),
		y: window.innerHeight - FROG_BOTTOM_MARGIN,
		dir: frog.direction,
	});

	wireFrogClick();
	wireMouseTracking();

	setInterval(tick, UPDATE_INTERVAL);
	exposeAPI();
	log("Pocket Frog ready.");
}

/**
 * Expose a stable runtime API on `window.__pocketFrogAPI__` so the Obsidian
 * settings tab (which lives outside the bundled IIFE) can call into us.
 */
function exposeAPI() {
	const w = /** @type {any} */ (window);
	w.__pocketFrogAPI__ = {
		getSettings,
		updateSettings,
		addCustomSpecies,
		getCustomSpecies,
		/** @param {string} apiKey @param {string} description */
		generateSpecies(apiKey, description) {
			const httpPost = w.__pocketFrogHttp__;
			return generateSpeciesViaClaude(apiKey, description, httpPost);
		},
		renderSpeciesPreview,
	};
}

/**
 * Render a species preview onto a caller-supplied canvas. Used by the
 * settings tab to show the result of a generation before the user commits.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ name: string, latinName: string, description: string, rarity: string, colors: Record<string, string>, tags?: string[] }} sp
 */
function renderSpeciesPreview(canvas, sp) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
	const w = FROG_SPRITE.BASE[0].length;
	const h = SPRITE_HEIGHT;
	const scale = Math.max(1, Math.floor(Math.min(canvas.width / w, canvas.height / h)));
	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const drawW = w * scale;
	const drawH = h * scale;
	const offsetX = Math.floor((canvas.width - drawW) / 2);
	const offsetY = Math.floor((canvas.height - drawH) / 2);
	const ft = new FrogType(
		"preview",
		sp.name,
		sp.description,
		sp.latinName,
		"",
		sp.colors,
		sp.tags ?? [],
		/** @type any */ (sp.rarity),
	);
	const frame = new Frame([new Layer(FROG_SPRITE.BASE)]);
	ctx.save();
	ctx.translate(offsetX, offsetY);
	frame.draw(ctx, Directions.RIGHT, scale, ft.colors, ft.tags || []);
	ctx.restore();
}

async function loadSaveData() {
	const raw = await context.getSaveData();
	const data = /** @type {Partial<FrogSaveData>} */ (raw);
	const builtInIds = Object.keys(SPECIES);
	const settings = data.settings ?? {};
	return /** @type {FrogSaveData} */ ({
		unlockedSpecies: data.unlockedSpecies ?? builtInIds.slice(),
		currentSpecies: data.currentSpecies ?? DEFAULT_SPECIES,
		customSpecies: data.customSpecies ?? [],
		settings,
	});
}

async function persistSaveData() {
	await context.putSaveData(save);
}

/**
 * Merge built-in species with user-generated custom species.
 * @param {CustomSpecies[]} custom
 * @returns {Record<string, FrogType>}
 */
function buildSpeciesRegistry(custom) {
	const out = { ...SPECIES };
	for (const c of custom) {
		try {
			const ft = new FrogType(c.id, c.name, c.description, c.latinName, "", c.colors, c.tags ?? [], /** @type any */ (c.rarity));
			const missing = ft.missingColorKeys();
			if (missing.length > 0) {
				error(`Custom species ${c.id} missing colors: ${missing.join(",")}; skipping`);
				continue;
			}
			out[c.id] = ft;
		} catch (e) {
			error(`Failed to load custom species ${c.id}:`, e);
		}
	}
	return out;
}

function tick() {
	const now = Date.now();

	// Phantom-bird DOM probe (polled, not every frame)
	if (now - lastPhantomPoll > PHANTOM_BIRD_POLL_INTERVAL) {
		syncPhantomBird();
		lastPhantomPoll = now;
	}

	// Update hop progression
	if (hopState) {
		const t = (now - hopState.startedAt) / HOP_DURATION;
		if (t >= 1) {
			frog.setX(hopState.targetX);
			frog.setY(FROG_BOTTOM_MARGIN);
			hopState = null;
			frog.setAnimation(Animations.STILL);
			stillSince = now;
		} else {
			const x = hopState.startX + (hopState.targetX - hopState.startX) * t;
			const yOffset = Math.sin(t * Math.PI) * HOP_PEAK_HEIGHT;
			frog.setX(x);
			frog.setY(FROG_BOTTOM_MARGIN + yOffset);
		}
	} else if (frog.getCurrentAnimation() === Animations.STILL) {
		// Cross-pet behaviour decisions
		const target = pickInteractionTarget();
		if (target) {
			frog.setDirection(target.x > frog.getX() ? Directions.RIGHT : Directions.LEFT);
			if (target.distance < VERY_NEAR_PET_DIST && now - stillSince > HOP_TOWARD_PET_DELAY) {
				startHopToward(target.x, now);
			}
		} else if (Math.random() < HOP_CHANCE) {
			randomHop(now);
		}
	} else if (frog.getCurrentAnimation() === Animations.HEART) {
		if (now - frog.animStart > HEART_DURATION) {
			frog.setAnimation(Animations.STILL);
			stillSince = now;
		}
	}

	// Publish position to bus
	if (now - lastBusPublish > PET_BUS_PUBLISH_INTERVAL) {
		const r = frog.getElement().getBoundingClientRect();
		getBus().update(FROG_BUS_ID, {
			species: "frog",
			x: r.left + r.width / 2,
			y: r.top + r.height / 2,
			dir: frog.direction,
		});
		lastBusPublish = now;
	}

	// Draw
	const sp = currentSpecies();
	frog.draw(sp);
}

/**
 * Find the nearest other pet within NEAR_PET_DIST. Excludes ourselves.
 * Returns null if none in range.
 * @returns {null | { id: string, x: number, y: number, distance: number }}
 */
function pickInteractionTarget() {
	const myRect = frog.getElement().getBoundingClientRect();
	const myCx = myRect.left + myRect.width / 2;
	const myCy = myRect.top + myRect.height / 2;
	let best = null;
	for (const [id, info] of getBus().pets) {
		if (id === FROG_BUS_ID) continue;
		const dx = info.x - myCx;
		const dy = info.y - myCy;
		const d = Math.hypot(dx, dy);
		if (d < NEAR_PET_DIST && (!best || d < best.distance)) {
			best = { id, x: info.x, y: info.y, distance: d };
		}
	}
	return best;
}

/**
 * @param {number} targetViewportX
 * @param {number} now
 */
function startHopToward(targetViewportX, now) {
	const myX = frog.getX();
	const dx = clampStep(targetViewportX - myX);
	const target = clampToViewport(myX + dx);
	startHop(target, now);
}

/** @param {number} now */
function randomHop(now) {
	const dir = Math.random() < 0.5 ? -1 : 1;
	const target = clampToViewport(frog.getX() + dir * HOP_DISTANCE);
	startHop(target, now);
}

/** @param {number} target @param {number} now */
function startHop(target, now) {
	if (target === frog.getX()) return;
	frog.setDirection(target > frog.getX() ? Directions.RIGHT : Directions.LEFT);
	hopState = { startX: frog.getX(), targetX: target, startedAt: now };
	frog.setAnimation(Animations.JUMP_ARC);
}

/** @param {number} dx */
function clampStep(dx) {
	if (Math.abs(dx) < 4) return 0;
	return Math.sign(dx) * Math.min(Math.abs(dx), HOP_DISTANCE);
}

/** @param {number} x */
function clampToViewport(x) {
	const margin = 32;
	return Math.max(margin, Math.min(window.innerWidth - margin, x));
}

function currentSpecies() {
	return allSpecies[save.currentSpecies] ?? allSpecies[DEFAULT_SPECIES];
}

function wireFrogClick() {
	const el = frog.getElement();
	onClick(el, () => {
		if (isMenuOpen()) { closeMenu(); return; }
		const r = el.getBoundingClientRect();
		openMenu(
			[
				{ label: "Pet Frog", action: triggerHeart },
				{ label: "Field Guide", action: openFieldGuide },
			],
			r.left + r.width + 8,
			window.innerHeight - r.top,
		);
	});
}

function triggerHeart() {
	frog.setAnimation(Animations.HEART);
}

function wireMouseTracking() {
	document.addEventListener("mousemove", (e) => {
		const r = frog.getElement().getBoundingClientRect();
		const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
		if (!inside) {
			lastMouseX = -1;
			lastSweepDir = 0;
			return;
		}
		if (lastMouseX < 0) { lastMouseX = e.clientX; return; }
		const dir = Math.sign(e.clientX - lastMouseX);
		if (dir !== 0 && dir !== lastSweepDir) {
			lastPetSweeps.push({ ts: Date.now(), dir });
			lastSweepDir = dir;
			const cutoff = Date.now() - PET_SWEEP_WINDOW;
			lastPetSweeps = lastPetSweeps.filter((s) => s.ts > cutoff);
			if (lastPetSweeps.length >= PET_SWEEP_THRESHOLD && frog.getCurrentAnimation() !== Animations.HEART) {
				lastPetSweeps = [];
				triggerHeart();
			}
		}
		lastMouseX = e.clientX;
	});
}

// ---- Field Guide ----

const FIELD_GUIDE_ID = "frog-field-guide";

function openFieldGuide() {
	const root = getShadowRoot();
	const existing = root.getElementById?.(FIELD_GUIDE_ID) ?? root.querySelector("#" + FIELD_GUIDE_ID);
	if (existing) existing.remove();

	const panel = makeElement("frog-field-guide", undefined, FIELD_GUIDE_ID);
	const title = makeElement("frog-field-guide-title", "Field Guide");
	panel.appendChild(title);
	const grid = makeElement("frog-field-guide-grid");
	for (const id of save.unlockedSpecies) {
		const sp = allSpecies[id];
		if (!sp) continue;
		grid.appendChild(buildSpeciesCard(id, sp));
	}
	panel.appendChild(grid);
	const close = document.createElement("button");
	close.className = "frog-field-guide-close";
	close.textContent = "Close";
	close.addEventListener("click", () => panel.remove());
	panel.appendChild(close);
	root.appendChild(panel);
}

/**
 * @param {string} id
 * @param {FrogType} sp
 */
function buildSpeciesCard(id, sp) {
	const card = makeElement("frog-field-guide-card");
	if (id === save.currentSpecies) card.classList.add("active");
	const canvas = document.createElement("canvas");
	canvas.width = 32 * 2;
	canvas.height = SPRITE_HEIGHT * 2;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
	const baseFrame = new Frame([new Layer(FROG_SPRITE.BASE)]);
	baseFrame.draw(ctx, Directions.RIGHT, 2, sp.colors, sp.tags || []);
	card.appendChild(canvas);
	const name = makeElement("frog-field-guide-card-name", sp.name);
	card.appendChild(name);
	card.addEventListener("click", async () => {
		save.currentSpecies = id;
		await persistSaveData();
		openFieldGuide(); // re-render to update active state
	});
	return card;
}

// ---- Public API for settings tab to add a custom species ----

/** @param {CustomSpecies} cs */
export async function addCustomSpecies(cs) {
	if (!cs.id) cs.id = "custom_" + Date.now().toString(36);
	const existingIdx = save.customSpecies.findIndex((c) => c.id === cs.id);
	if (existingIdx >= 0) save.customSpecies[existingIdx] = cs;
	else save.customSpecies.push(cs);
	if (!save.unlockedSpecies.includes(cs.id)) save.unlockedSpecies.push(cs.id);
	allSpecies = buildSpeciesRegistry(save.customSpecies);
	await persistSaveData();
}

/** @param {Partial<FrogSettings>} patch */
export async function updateSettings(patch) {
	save.settings = { ...save.settings, ...patch };
	if (patch.visible !== undefined) frog.setVisible(patch.visible);
	await persistSaveData();
}

export function getSettings() { return { ...save.settings }; }
export function getCustomSpecies() { return save.customSpecies.slice(); }
