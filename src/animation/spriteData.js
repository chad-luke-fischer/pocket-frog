import { PALETTE } from "./sprites.js";

/**
 * Compact pixel-grid notation. Each character maps to a palette slot.
 * Authoring this in code (instead of a PNG) keeps the sprite definition
 * auditable and removes the PNG-decoding step at runtime.
 *
 * Convention: layers face RIGHT. Frame.draw() flips horizontally for LEFT.
 */
const CHAR_MAP = {
	" ": PALETTE.TRANSPARENT,
	".": PALETTE.TRANSPARENT,
	"O": PALETTE.OUTLINE,
	"B": PALETTE.BODY,
	"b": PALETTE.BELLY,
	"u": PALETTE.UNDERBELLY,
	"s": PALETTE.SPOTS,
	"r": PALETTE.EYE_RING,
	"e": PALETTE.EYE,
	"m": PALETTE.MOUTH,
	"w": PALETTE.WEBBING,
	"f": PALETTE.FOOT,
	"H": PALETTE.HEART,
	"h": PALETTE.HEART_BORDER,
	"*": PALETTE.HEART_SHINE,
};

/**
 * @param {string[]} rows
 * @returns {string[][]}
 */
function parseGrid(rows) {
	const expectedWidth = rows[0].length;
	return rows.map((row, y) => {
		if (row.length !== expectedWidth) {
			throw new Error(`Row ${y} width ${row.length} != expected ${expectedWidth}: "${row}"`);
		}
		return [...row].map((ch) => {
			const token = CHAR_MAP[ch];
			if (token === undefined) throw new Error(`Unknown sprite char "${ch}" at row ${y}`);
			return token;
		});
	});
}

// 32x32 frog sprites. All face RIGHT.
//
// Base (sitting). Big eyes on top, mouth below, body+belly, feet at the corners.
const BASE = parseGrid([
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"............OOOOOOOO............",
	"..........OOBBBBBBBBOO..........",
	".........OBBBBBBBBBBBBO.........",
	".........OBOOBBBBBBOOBO.........",
	".........OBOeeBBBBeeOBO.........",
	".........OBOeeBBBBeeOBO.........",
	".........OBOOBBBBBBOOBO.........",
	".........OBBBBBBBBBBBBO.........",
	"........OBBBBmmmmmmBBBBO........",
	".......OBBBBBBBBBBBBBBBBO.......",
	"......OBBBbbbbbbbbbbbbBBBO......",
	".....OBBbbbbbbbbbbbbbbbbBBO.....",
	"....OBBbbbbbbbbbbbbbbbbbbBBO....",
	"....OBbbbbbbbbbbbbbbbbbbbbBO....",
	"....OBbbbbbbbbbbbbbbbbbbbbBO....",
	"....OBubbbbbbbbbbbbbbbbbbuBO....",
	"....OBuubbbbbbbbbbbbbbbbuuBO....",
	"....OBuuubbbbbbbbbbbbbbuuuBO....",
	"....OOuuuuOOuuuuuuuuOOuuuuOO....",
	"...OffOuuuOOuuuuuuuuOOuuuOffO...",
	"..OffffOOOOuuuuuuuuOOOOffffO....",
	"..OwfffOOOOOOOOOOOOOOOOfffwO....",
	"..OwwwwO............OwwwwO......",
	"...OOO................OOO.......",
	"................................",
	"................................",
	"................................",
]);

// Mid-hop (squashed). Body wider, eyes lower, legs compressed.
const MID_HOP = parseGrid([
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"...........OOOOOOOOOO...........",
	".........OOBBBBBBBBBBOO.........",
	".......OOBBBBBBBBBBBBBBOO.......",
	"......OBBOOBBBBBBBBOOBBBBO......",
	".....OBBOeeBBBBBBBBeeOBBBBO.....",
	"....OBBBOeeBBBBBBBBeeOBBBBBO....",
	"....OBBBOOBBBBBBBBBBOOBBBBBO....",
	"...OBBBBBBBBBmmmmmmBBBBBBBBBO...",
	"..OBBbbbbbbbbbbbbbbbbbbbbbbBBO..",
	".OBbbbbbbbbbbbbbbbbbbbbbbbbbBO..",
	".Obbbbbbbbbbbbbbbbbbbbbbbbbbbo..",
	".OBubbbbbbbbbbbbbbbbbbbbbbbuBO..",
	"..OBuubbbbbbbbbbbbbbbbbbbuuBO...",
	"..OOuuuuOOOOOOOOOOOOOOOOuuuuOO..",
	".OffwOuuOOO...........OOOuuOwffO",
	".OffwwOOOOOOOO........OOOOOOffwO",
	"..OOOO..OwwwO..........OwwwO.OOO",
	"...........OOO........OOO.......",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
]);

// Peak-hop (stretched). Tall thin body, eyes up high, legs trailing.
const PEAK_HOP = parseGrid([
	"................................",
	"............OOOOOOOO............",
	"..........OOBBBBBBBBOO..........",
	".........OBBBBBBBBBBBBO.........",
	".........OBOOBBBBBBOOBO.........",
	".........OBOeeBBBBeeOBO.........",
	".........OBOeeBBBBeeOBO.........",
	".........OBOOBBBBBBOOBO.........",
	"........OBBBBmmmmmmBBBBO........",
	"........OBBBBBBBBBBBBBBO........",
	".......OBBbbbbbbbbbbbbBBO.......",
	".......OBbbbbbbbbbbbbbbBO.......",
	".......OBbbbbbbbbbbbbbbBO.......",
	".......OBbbbbbbbbbbbbbbBO.......",
	".......OBubbbbbbbbbbbbuBO.......",
	".......OBuubbbbbbbbbbuuBO.......",
	".......OBBuubbbbbbbbuuBBO.......",
	"........OBBuuuuuuuuuuBBO........",
	".........OBBuuuuuuuuBBO.........",
	"..........OBBuuuuuuBBO..........",
	"...........OBBuuuuBBO...........",
	"...........OBfuufuBO............",
	"..........OBffuufBffO...........",
	"..........OffwwwfffwO...........",
	"..........Offwff.Owwwf..........",
	"...........Owwf...OOO...........",
	"............OOO.................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
]);

// Heart overlay (drawn on top of base when petted)
const HEART = parseGrid([
	"................................",
	"................................",
	"................................",
	"................................",
	"...........hh.hh................",
	"..........hHH*HHh...............",
	"..........hHHHHHh...............",
	"..........hHHHHHh...............",
	"...........hHHHh................",
	"............hHh.................",
	".............h..................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
	"................................",
]);

export const FROG_SPRITE = Object.freeze({
	BASE,
	MID_HOP,
	PEAK_HOP,
	HEART,
});

export const SPRITE_WIDTH = 32;
export const SPRITE_HEIGHT = 32;
