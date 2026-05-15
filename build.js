// @ts-check
//
// Pocket Frog build. Single-target (Obsidian).
// Adapted from IdreesInc/Pocket-Bird@main/build.js.

import { rollup } from 'rollup';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';

const SRC_DIR = "./src";
const FONTS_DIR = "./fonts";
const DIST_DIR = "./dist";
const OBSIDIAN_DIR = DIST_DIR + "/obsidian";

const STYLESHEET_PATH = SRC_DIR + "/stylesheet.css";
const OBSIDIAN_ENTRY = SRC_DIR + "/platforms/obsidian/obsidian.js";
const OBSIDIAN_MANIFEST = SRC_DIR + "/platforms/obsidian/manifest.json";
const OBSIDIAN_WRAPPER = SRC_DIR + "/platforms/obsidian/wrapper.js";

const TEMP_BUNDLED_OUTPUT = DIST_DIR + "/frog.bundled.js";

const VERSION_KEY = "__VERSION__";
const STYLESHEET_KEY = "___STYLESHEET___";
const MONOCRAFT_URL_KEY = "__MONOCRAFT_URL__";
const CODE_KEY = "__CODE__";

const now = new Date();
const version = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

console.log(`Building Pocket Frog v${version}...`);
mkdirSync(DIST_DIR, { recursive: true });

// 1. Bundle the Obsidian entry point with rollup.
const bundle = await rollup({ input: OBSIDIAN_ENTRY });
await bundle.write({ file: TEMP_BUNDLED_OUTPUT, format: 'iife' });
await bundle.close();

let code = readFileSync(TEMP_BUNDLED_OUTPUT, 'utf8');
unlinkSync(TEMP_BUNDLED_OUTPUT);

// 2. Embed the stylesheet inline.
const stylesheet = readFileSync(STYLESHEET_PATH, 'utf8');
code = code.replace(STYLESHEET_KEY, stylesheet);

// 3. Embed the Monocraft font as a base64 data URI so the plugin works fully offline.
const fontB64 = readFileSync(FONTS_DIR + '/Monocraft.otf', 'base64');
code = code.replaceAll(MONOCRAFT_URL_KEY, `data:font/otf;base64,${fontB64}`);

// 4. Wrap with the Obsidian Plugin boilerplate.
let wrapper = readFileSync(OBSIDIAN_WRAPPER, 'utf8');
wrapper = wrapper.replaceAll(VERSION_KEY, version).replace(CODE_KEY, code);

mkdirSync(OBSIDIAN_DIR, { recursive: true });
writeFileSync(OBSIDIAN_DIR + '/main.js', wrapper);

// 5. Write the Obsidian manifest.
let manifest = readFileSync(OBSIDIAN_MANIFEST, 'utf8');
manifest = manifest.replace(VERSION_KEY, version);
writeFileSync(OBSIDIAN_DIR + '/manifest.json', manifest);

console.log(`Built ${OBSIDIAN_DIR}/main.js + manifest.json`);
