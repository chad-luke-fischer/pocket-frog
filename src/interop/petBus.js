/**
 * Cross-pet event bus. Lives on `window.__pocketPets__` so any pet plugin
 * loaded into the same Obsidian (or browser) window can publish its position
 * and react to others.
 *
 * Design notes:
 * - The first plugin to load creates the bus; subsequent plugins join it.
 * - Bus shape is intentionally simple: a Map of pet entries + listeners.
 * - Each pet owns its own state; nothing in the bus persists.
 * - Pocket Bird does not currently publish to the bus, so we keep a
 *   `syncPhantomBird()` helper that probes for the `#birb` DOM element
 *   on a slow interval and synthesises a phantom entry on its behalf.
 */

const KEY = "__pocketPets__";
const VERSION = 1;

/**
 * @typedef {Object} PetInfo
 * @property {string} species - "frog", "bird", etc.
 * @property {number} x - Centre X in viewport pixels
 * @property {number} y - Centre Y in viewport pixels (top-down, like getBoundingClientRect)
 * @property {number} dir - -1 (LEFT) or 1 (RIGHT)
 * @property {string} [mood]
 */

/**
 * @typedef {Object} BusEvent
 * @property {"join"|"leave"|"update"} type
 * @property {string} id
 * @property {PetInfo} [info]
 */

/**
 * @returns {{
 *   version: number,
 *   pets: Map<string, PetInfo>,
 *   listeners: Set<(e: BusEvent) => void>,
 *   register: (id: string, info: PetInfo) => void,
 *   unregister: (id: string) => void,
 *   update: (id: string, info: Partial<PetInfo>) => void,
 *   on: (fn: (e: BusEvent) => void) => () => void,
 * }}
 */
export function getBus() {
	const w = /** @type {any} */ (window);
	if (!w[KEY]) {
		const bus = {
			version: VERSION,
			pets: new Map(),
			listeners: new Set(),
			/** @param {string} id @param {PetInfo} info */
			register(id, info) {
				bus.pets.set(id, info);
				emit({ type: "join", id, info });
			},
			/** @param {string} id */
			unregister(id) {
				if (!bus.pets.delete(id)) return;
				emit({ type: "leave", id });
			},
			/** @param {string} id @param {Partial<PetInfo>} info */
			update(id, info) {
				const prev = bus.pets.get(id);
				const merged = { ...(prev ?? { species: "unknown", x: 0, y: 0, dir: 1 }), ...info };
				bus.pets.set(id, merged);
				emit({ type: "update", id, info: merged });
			},
			/** @param {(e: BusEvent) => void} fn */
			on(fn) {
				bus.listeners.add(fn);
				return () => bus.listeners.delete(fn);
			},
		};
		/** @param {BusEvent} e */
		function emit(e) { for (const l of bus.listeners) try { l(e); } catch (_) {} }
		w[KEY] = bus;
	}
	return w[KEY];
}

const PHANTOM_BIRD_ID = "birb-phantom";

/**
 * If Pocket Bird is loaded but doesn't publish to the bus, peek at its
 * DOM element and synthesize a phantom entry. Idempotent; safe to call on
 * a slow interval (every ~500ms is fine).
 */
export function syncPhantomBird() {
	const bus = getBus();
	const el = document.getElementById("birb");
	if (!el) {
		bus.unregister(PHANTOM_BIRD_ID);
		return;
	}
	const r = el.getBoundingClientRect();
	if (r.width === 0 && r.height === 0) {
		bus.unregister(PHANTOM_BIRD_ID);
		return;
	}
	bus.update(PHANTOM_BIRD_ID, {
		species: "bird",
		x: r.left + r.width / 2,
		y: r.top + r.height / 2,
		dir: 1,
	});
}
