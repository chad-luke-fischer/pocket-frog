# Pocket Frog

A pixel-art frog that hops around your Obsidian notes. Click to pet it, swap between species in the Field Guide, and generate brand-new species on demand using Claude.

If you also have [Pocket Bird](https://github.com/IdreesInc/Pocket-Bird) enabled, the frog notices the bird and reacts.

## Install

1. Build:
   ```
   npm install
   npm run build
   ```
2. Symlink (or copy) `dist/obsidian/` into your vault:
   ```
   <vault>/.obsidian/plugins/pocket-frog/
   ```
3. In Obsidian, **Settings → Community plugins → Pocket Frog → Enable**.

## Generating new species with Claude

Open **Settings → Pocket Frog**, paste your Anthropic API key, type a description ("a frosty arctic frog with deep blue spots"), hit **Generate**, then **Add to my collection**. The frog appears in your Field Guide alongside the built-in species.

The API key lives only in this plugin's local data file (`<vault>/.obsidian/plugins/pocket-frog/data.json`). API calls go straight from your Obsidian renderer to Anthropic — no proxy.

## Cross-pet interaction

When both Pocket Bird and Pocket Frog are enabled, the frog turns to face the bird when it's nearby and hops toward it after a few idle seconds. The bus is on `window.__pocketPets__`; future pets can join the same registry.

## Credits

The plugin's animation and sprite-palette architecture is adapted from [Pocket Bird](https://github.com/IdreesInc/Pocket-Bird) by Idrees Hassan, used under MPL-2.0. Pocket Bird is a wonderful project — go install it too.

## License

MPL-2.0 (same as Pocket Bird).
