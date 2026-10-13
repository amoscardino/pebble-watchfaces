---
alwaysApply: true
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A collection of independent Pebble watchfaces written in embedded JavaScript using Pebble Alloy (Moddable XS runtime, `projectType: "moddable"`). Each top-level directory (`analog`, `binary-dial`, `ring-dial`, `solar-dial`, `squares`) is a self-contained Pebble project with its own `package.json`, `wscript`, and build output. There is no root-level package, shared library, linter, or test suite.

## Commands

Run from inside a watchface directory (requires the `pebble` CLI on PATH):

```sh
npm run build    # pebble build
npm run start    # build + install to emulator(s)
npm run debug    # build with --debug (enables xsbug JS debugger) + install
```

Most faces target only **gabbro** (Pebble Round 2). `squares` also targets **emery** (Pebble Time 2) and has per-platform scripts instead of `debug`: `start:time`, `start:round`, `debug:time`, `debug:round`.

## Project layout (per watchface)

- `src/embeddedjs/main.js` — the watchface itself; runs on the watch in the XS VM. All rendering logic lives here.
- `src/embeddedjs/manifest.json` — Moddable manifest. Every JS module must be listed under `modules`, and custom fonts must be declared under `resources` (`*-alpha`) with each size used.
- `src/pkjs/index.js` — phone-side PebbleKit JS. Empty or trivial unless the face needs phone services.
- `src/c/mdbl.c` — boilerplate C entry point that creates the Moddable machine (debug flag under `PBL_DEBUG`). Identical across faces; don't normally edit.
- `wscript` — stock Pebble waf build script; identical across faces.
- `package.json` `pebble` block — display name, UUID, target platforms, capabilities, and `messageKeys`.

`dates.js` (day/month abbreviations) is duplicated in `squares` and `solar-dial`; there is no cross-project sharing mechanism, so copy rather than import across faces.

## Rendering patterns

All faces follow the same structure:

- `const render = new Poco(screen)` (from `commodetto/Poco`); colors via `render.makeColor(r, g, b)`.
- A `draw(evt)` function wrapped in `render.begin()` / `render.end()`, registered with `watch.addEventListener('minutechange', draw)`. Use `evt?.date` for the current time.
- Respect `watch.hour12` for 12/24-hour formatting; `screen.round` distinguishes round vs. rectangular displays.
- Built-in system fonts: `new render.Font("Gothic-Regular", 14)` etc.
- Custom TTF fonts (in `src/embeddedjs/assets/`) are declared in the manifest and loaded with `parseBMF(new Resource(`${name}-${size}.fnt`))` plus `parseRLE(new Resource(`${name}-${size}-alpha.bm4`))` assigned to `font.bitmap` (see `squares/main.js`).

## Watch ↔ phone communication (solar-dial)

`solar-dial` is the only face with a phone component and is the reference for this pattern:

- Watch side gets GPS via `embedded:sensor/Location` (requires `"capabilities": ["location"]`) and talks to the phone via `pebble/message`. Message keys must match `messageKeys` in `package.json`.
- Only call `msg.write()` after `onWritable` fires, and stop on `onSuspend` — the location proxy shares the channel and `write()` throws otherwise.
- AppMessage integers only: send floats (lat/long) as strings and dates as Unix seconds.
- Phone side (`pkjs/index.js`) must route events through `@moddable/pebbleproxy` (`readyReceived`, `appMessageReceived`) and reply via `moddableProxy.sendAppMessage` so it doesn't collide with proxy traffic. npm deps (e.g. `suncalc`) are bundled into pkjs.
- Results are cached in watch `localStorage` so the dial renders correctly before a fresh lookup completes.

## SDK Documentation

The full Pebble SDK documentation is available at https://developer.repebble.com.

An index of every page is at https://developer.repebble.com/llms.txt. Use it to discover what's available. Every page also has a Markdown version: append `.md` to any documentation URL to fetch plain Markdown instead of HTML (e.g. `https://developer.repebble.com/guides/events-and-services/buttons.md`). Prefer the `.md` form when reading docs.
