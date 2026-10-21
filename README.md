# Pebble Watchfaces

A collection of Pebble watchfaces built with [Pebble Alloy](https://developer.repebble.com) (embedded JavaScript via Moddable XS).

Experiments for now, may release some or all to the Pebble Appstore (eventually).

## Watchfaces

- `analog`
- `binary-dial`
- `solar-dial`
- `squares`
- `steps`
- `threads`

## Editor setup

Each watchface has an editor-only `tsconfig.json` that finds the Pebble SDK's TypeScript typings through a `.pebble-sdk` symlink in the repo root. The SDK installs to a different place on each OS, so this link is gitignored and has to be created once on each machine:

```sh
./link-sdk.sh
```

The script finds the installed SDK (`~/Library/Application Support/Pebble SDK` on macOS, `~/.local/share/pebble-sdk` on Linux) and links to its `SDKs/current` folder. You don't need to run it again after an SDK upgrade. Afterwards, restart the TypeScript server in your editor (in VS Code, run "TypeScript: Restart TS Server").

Type-check a watchface with `npx tsc` from its directory. The build doesn't use this config, so builds work without the link.

## Building

From any watchface directory:

```sh
npm run build
```

## Running

From any watchface directory:

```sh
npm run start
```

> Most target only **gabbro** (Pebble Round 2), but `squares` also targets **emery** (Pebble Time 2).
