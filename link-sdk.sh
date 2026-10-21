#!/bin/sh
# Points .pebble-sdk at this machine's installed Pebble SDK so the editor-only
# tsconfig.json files in each face can resolve the Moddable typings.
set -e
cd "$(dirname "$0")"

for dir in \
  "$HOME/Library/Application Support/Pebble SDK/SDKs" \
  "${XDG_DATA_HOME:-$HOME/.local/share}/pebble-sdk/SDKs"; do
  if [ -e "$dir/current" ]; then
    ln -sfn "$dir/current" .pebble-sdk
    echo ".pebble-sdk -> $dir/current"
    exit 0
  fi
done

echo "Pebble SDK not found; install it with 'pebble sdk install latest'" >&2
exit 1
