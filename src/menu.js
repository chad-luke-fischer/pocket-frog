import { getShadowRoot, makeElement, onClick } from "./shared.js";

const MENU_ID = "frog-menu";

/** @type {HTMLElement|null} */
let currentMenu = null;

/**
 * @param {{ label: string, action: () => void }[]} items
 * @param {number} anchorX
 * @param {number} anchorY
 */
export function openMenu(items, anchorX, anchorY) {
	closeMenu();
	const menu = makeElement("frog-menu", undefined, MENU_ID);
	for (const it of items) {
		const el = makeElement("frog-menu-item", it.label);
		onClick(el, () => {
			closeMenu();
			it.action();
		});
		menu.appendChild(el);
	}
	menu.style.left = `${anchorX}px`;
	menu.style.bottom = `${anchorY}px`;
	getShadowRoot().appendChild(menu);
	currentMenu = menu;

	// Close on outside click
	setTimeout(() => {
		document.addEventListener("click", outsideClick, { once: true });
	}, 0);
}

function outsideClick(e) {
	const target = /** @type {Node} */ (e.target);
	if (currentMenu && !currentMenu.contains(target)) closeMenu();
}

export function closeMenu() {
	if (currentMenu) {
		currentMenu.remove();
		currentMenu = null;
	}
}

export function isMenuOpen() {
	return currentMenu !== null;
}
