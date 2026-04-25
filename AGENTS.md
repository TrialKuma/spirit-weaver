# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Spirit Weaver (灵魂编织者) is a static client-side turn-based RPG browser game built with vanilla HTML/CSS/JavaScript — no frameworks, no bundlers, no `package.json`. The entire game lives in the `game-v2/` directory.

### Running the dev server

Any static HTTP server pointed at `game-v2/` will work. The simplest option:

```
python3 -m http.server 8080 --directory game-v2
```

The game is then available at `http://localhost:8080/`. Using `file://` will **not** work because the Web Audio API requires HTTP.

### Linting / Testing / Building

- There is **no build step**, no linter config, no test framework, and no `package.json`.
- Validation is manual: open the game in a browser, select a character class, choose a spirit, and play through combat.
- Check the browser console for JS errors as the primary form of "linting."

### Netlify deployment

Production is deployed via Netlify. `netlify.toml` sets `publish = "game-v2"`.

### Script load order matters

`index.html` loads 13 JS files in a strict dependency order (state → utils → sfx → audio → skills → classes → enemies → upgrade_config → upgrades → run → rest → ui → main). Adding new scripts or reordering will break the game.

### Audio assets

Background music WAV files are pre-generated and committed. The optional Python tool `game-v2/tools/generate_bgm_wav.py` only needs to be re-run if BGM changes are required.
