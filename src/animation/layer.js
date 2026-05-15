export const TAG = {
	DEFAULT: "default",
	SPOTS: "spots",
};

class Layer {
	/**
	 * @param {string[][]} pixels
	 * @param {string} [tag]
	 */
	constructor(pixels, tag = TAG.DEFAULT) {
		this.pixels = pixels;
		this.tag = tag;
	}
}

export default Layer;