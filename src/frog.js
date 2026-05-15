import { Directions, getShadowRoot } from "./shared.js";
import Layer from "./animation/layer.js";
import Frame from "./animation/frame.js";
import Anim from "./animation/anim.js";
import { FROG_SPRITE, SPRITE_HEIGHT } from "./animation/spriteData.js";

/**
 * @typedef {keyof typeof Animations} AnimationType
 */

export const Animations = /** @type {const} */ ({
	STILL: "STILL",
	JUMP_ARC: "JUMP_ARC",
	HEART: "HEART",
});

export class Frog {
	x = 0;
	y = 0;
	direction = Directions.RIGHT;
	visible = true;
	/** @type {AnimationType} */
	currentAnimation = Animations.STILL;
	animStart = Date.now();

	/** @param {number} canvasPixelSize */
	constructor(canvasPixelSize) {
		this.canvasPixelSize = canvasPixelSize;

		this.layers = {
			base: new Layer(FROG_SPRITE.BASE),
			midHop: new Layer(FROG_SPRITE.MID_HOP),
			peakHop: new Layer(FROG_SPRITE.PEAK_HOP),
			heart: new Layer(FROG_SPRITE.HEART),
		};

		this.frames = {
			base: new Frame([this.layers.base]),
			midHop: new Frame([this.layers.midHop]),
			peakHop: new Frame([this.layers.peakHop]),
			heart: new Frame([this.layers.base, this.layers.heart]),
		};

		this.animations = {
			[Animations.STILL]: new Anim([this.frames.base], [1000]),
			[Animations.JUMP_ARC]: new Anim(
				[this.frames.midHop, this.frames.peakHop, this.frames.midHop, this.frames.base],
				[80, 120, 80, 30],
				false,
			),
			[Animations.HEART]: new Anim([this.frames.heart], [1500], false),
		};

		this.canvas = document.createElement("canvas");
		this.canvas.id = "frog";
		const widthPx = FROG_SPRITE.BASE[0].length;
		this.canvas.width = widthPx * canvasPixelSize;
		this.canvas.height = SPRITE_HEIGHT * canvasPixelSize;
		this.ctx = /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));

		getShadowRoot().appendChild(this.canvas);
	}

	/**
	 * @param {import('./animation/sprites.js').FrogType} species
	 * @returns {boolean} Whether the animation has completed (for non-looping)
	 */
	draw(species) {
		const anim = this.animations[this.currentAnimation];
		return anim.draw(
			this.ctx,
			this.direction,
			this.animStart,
			this.canvasPixelSize,
			species.colors,
			species.tags || [],
		);
	}

	/** @returns {AnimationType} */
	getCurrentAnimation() { return this.currentAnimation; }

	/** @param {AnimationType} name */
	setAnimation(name) {
		if (this.currentAnimation === name) return;
		this.currentAnimation = name;
		this.animStart = Date.now();
	}

	getElement() { return this.canvas; }
	getElementWidth() { return this.canvas.getBoundingClientRect().width; }
	getElementHeight() { return this.canvas.getBoundingClientRect().height; }

	/** @param {number} x */
	setX(x) {
		this.x = x;
		this.canvas.style.left = `${x - this.canvas.width / 2}px`;
	}
	/** @param {number} y */
	setY(y) {
		this.y = y;
		this.canvas.style.bottom = `${y}px`;
	}
	getX() { return this.x; }
	getY() { return this.y; }

	/** @param {number} d */
	setDirection(d) { this.direction = d; }

	/** @param {boolean} v */
	setVisible(v) {
		this.visible = v;
		this.canvas.style.display = v ? "" : "none";
	}
	isVisible() { return this.visible; }
}
