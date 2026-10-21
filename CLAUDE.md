---
alwaysApply: true
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A collection of independent Pebble watchfaces written in TypeScript using Pebble Alloy (Moddable XS runtime, `projectType: "moddable"`). Each top-level directory is a self-contained Pebble project with its own `package.json`, `tsconfig.json`, `wscript`, and build output. There is no root-level package, shared library, linter, or test suite.

## Commands

Run from inside a watchface directory (requires the `pebble` CLI on PATH, and `npm install` first for faces with npm dependencies):

```sh
npm run build    # pebble build (compiles the .ts sources)
npm run start    # build + install to emulator(s)
npm run debug    # build with --debug (enables xsbug JS debugger) + install
npx tsc          # optional type check only (noEmit); the build does not use this tsconfig
```

Most faces target only **gabbro** (Pebble Round 2). Faces that also target other platforms (e.g. **emery**, Pebble Time 2) use per-platform scripts such as `start:time` / `start:round` and `debug:time` / `debug:round`; check the face's `package.json`.

## Project layout (per watchface)

- `src/embeddedjs/main.ts` — the watchface entry point; runs on the watch in the XS VM. Larger faces split logic into additional modules alongside it.
- `src/embeddedjs/manifest.json` — Moddable manifest. It includes `$(MODDABLE)/examples/manifest_mod.json` and `manifest_typings.json` (the latter makes the Pebble build compile TypeScript). Every module must be listed under `modules` by extensionless path (`"./main"`), and custom fonts must be declared under `resources` (`*-alpha`) with each size used.
- `src/embeddedjs/pebble.d.ts` — fills gaps in the SDK's Moddable typings (e.g. `Screen.round`). Identical across faces; referenced at the top of each module with `/// <reference types="./pebble.d.ts" />`. Add missing SDK types here rather than casting.
- `tsconfig.json` — editor-only config mirroring the one the Pebble build generates. Its `paths`/`types` point at the SDK typings through `../.pebble-sdk/...`, a gitignored per-machine symlink to the installed SDK's `SDKs/current` (macOS: `~/Library/Application Support/Pebble SDK`, Linux: `~/.local/share/pebble-sdk`). Run `./link-sdk.sh` from the repo root once per machine to create it. Identical across faces.
- `src/pkjs/index.js` — phone-side PebbleKit JS, plain JavaScript (CommonJS `require`). Empty or trivial unless the face needs phone services.
- `src/c/mdbl.c` — boilerplate C entry point that creates the Moddable machine (debug flag under `PBL_DEBUG`). Identical across faces; don't normally edit.
- `wscript` — stock Pebble waf build script; identical across faces.
- `package.json` — `typescript` as a devDependency; the `pebble` block holds display name, UUID, target platforms, capabilities, and `messageKeys`.

There is no cross-project sharing mechanism, so copy rather than import across faces (e.g. `pebble.d.ts`, `tsconfig.json`, helpers like the font loader). When starting a new face, copy an existing one and give it a new UUID.

## Rendering patterns

All faces follow the same structure:

- `const render = new Poco(screen)` (from `commodetto/Poco`); colors via `render.makeColor(r, g, b)`.
- A `draw(evt)` function wrapped in `render.begin()` / `render.end()`, registered with `watch.addEventListener('minutechange', draw)`. Use `evt?.date` for the current time.
- Respect `watch.hour12` for 12/24-hour formatting; `screen.round` distinguishes round vs. rectangular displays.
- Built-in system fonts: `new render.Font("Gothic-Regular", 14)` etc.
- Custom TTF fonts (in `src/embeddedjs/assets/`) are declared in the manifest and loaded with a `getFont(name, size)` helper: `parseBMF(new Resource(`${name}-${size}.fnt`))` plus `parseRLE(new Resource(`${name}-${size}-alpha.bm4`))` assigned to `font.bitmap`. Non-ASCII glyphs need a `characters` entry on the resource (e.g. `"°"`).
- For `pebble/health`, check `Health.metric.accessible(...)` before querying.

## Watch ↔ phone communication

- Location comes from `embedded:sensor/Location` (requires `"capabilities": ["location"]`). Watch ↔ phone messages use `pebble/message`; keys must match `messageKeys` in `package.json`.
- Only call `msg.write()` after `onWritable` fires, and stop on `onSuspend` — the location proxy shares the channel and `write()` throws otherwise.
- AppMessage integers only: send floats (lat/long) as strings and dates as Unix seconds.
- Phone side (`pkjs/index.js`) must route events through `@moddable/pebbleproxy` (`readyReceived`, `appMessageReceived`) and reply via `moddableProxy.sendAppMessage` so it doesn't collide with proxy traffic. npm deps are bundled into pkjs.
- `fetch()` on the watch is carried through the phone by the proxy. The watch's `pebble/message` keeps only the latest unread message, so back-to-back messages from the phone can overwrite each other. This breaks multi-message proxy responses such as `fetch()` (dropped headers crash in `Headers`, dropped body gives `JSON.parse` "invalid value"). Any face using `fetch()` must wrap `Pebble.sendAppMessage` in pkjs to pause after each ACK (copy the wrapper from an existing face that does this).
- User settings use Clay (`@rebble/clay`, `src/pkjs/config.js`, `"configurable"` capability, one message key per setting).
- Cache results and settings in watch `localStorage` so the face renders correctly before a fresh lookup completes.

## SDK Documentation

The full Pebble SDK documentation is available at https://developer.repebble.com.

An index of every page is at https://developer.repebble.com/llms.txt. Use it to discover what's available. Every page also has a Markdown version: append `.md` to any documentation URL to fetch plain Markdown instead of HTML (e.g. `https://developer.repebble.com/guides/events-and-services/buttons.md`). Prefer the `.md` form when reading docs.
