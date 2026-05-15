export const Directions = {
	LEFT: -1,
	RIGHT: 1,
};

let debugMode = false;
/** @type {import('./context.js').Context|null} */
let context = null;
/** @type {ShadowRoot|undefined} */
let shadowRoot;

export function isDebug() {
	return debugMode;
}

/** @param {boolean} value */
export function setDebug(value) {
	debugMode = value;
}

export function getContext() {
	if (!context) {
		throw new Error("Context requested before being set");
	}
	return context;
}

/** @param {import('./context.js').Context} newContext */
export function setContext(newContext) {
	context = newContext;
}

/**
 * @param {string} className
 * @param {string} [textContent]
 * @param {string} [id]
 * @returns {HTMLElement}
 */
export function makeElement(className, textContent, id) {
	const element = document.createElement("div");
	element.classList.add(className);
	if (textContent) element.textContent = textContent;
	if (id) element.id = id;
	return element;
}

/**
 * @param {Document|Element} element
 * @param {(e: Event) => void} action
 */
export function onClick(element, action) {
	element.addEventListener("click", (e) => action(e));
	element.addEventListener("touchend", (e) => {
		if (e instanceof TouchEvent === false) return;
		if (element instanceof HTMLElement === false) return;
		const touch = e.changedTouches[0];
		const rect = element.getBoundingClientRect();
		if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
			touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
			action(e);
		}
	});
}

export function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function log(...args) { console.log("Frog:", ...args); }
export function debug(...args) { if (isDebug()) console.debug("Frog:", ...args); }
export function error(...args) { console.error("Frog:", ...args); }

export function getWindowHeight() { return window.innerHeight; }
export function getFixedWindowHeight() { return document.documentElement.clientHeight; }

/** @param {ShadowRoot} root */
export function setShadowRoot(root) { shadowRoot = root; }

/** @returns {ShadowRoot} */
export function getShadowRoot() {
	if (!shadowRoot) throw new Error("Shadow root requested before being set");
	return shadowRoot;
}
