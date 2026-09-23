#!/usr/bin/env bash
#
# Sync the design system from the Swarmia monorepo into web/public/ds.
#
# Two kinds of file live in web/public/ds:
#
#   copied   - taken verbatim from the monorepo. Never edit these by hand;
#              re-run this script instead. (colors.css, fonts/)
#   derived  - written by hand from apps/frontend/src/styles/theme.ts, which
#              is a styled-system object and has no CSS-variable form upstream.
#              (theme.css, typography.css, fonts.css)
#
# Because the derived files are hand-maintained, this script pins the hash of
# theme.ts they were built from and tells you when upstream has moved.
#
# Usage:  ./scripts/sync-design-system.sh [path-to-apps/frontend]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="${1:-$ROOT/../monorepo/apps/frontend}"
DS="$ROOT/web/public/ds"

if [ ! -f "$FRONTEND/src/styles/theme.ts" ]; then
  echo "error: no frontend at $FRONTEND (expected src/styles/theme.ts)" >&2
  echo "usage: $0 [path-to-apps/frontend]" >&2
  exit 1
fi

echo "syncing from $FRONTEND"

# --- copied: color tokens -----------------------------------------------------
# Generated upstream by contrib/generate-theme-colors.ts from
# src/styles/colors/colors.ts. Light theme only -- the prototype ships no dark.
cp "$FRONTEND/src/styles/colors/generated/theme-css-light.css" "$DS/colors.css"
echo "  colors.css        <- src/styles/colors/generated/theme-css-light.css"

# --- copied: fonts ------------------------------------------------------------
mkdir -p "$DS/fonts"
for f in FactorA-Regular FactorA-Medium FactorA-Bold; do
  cp "$FRONTEND/src/assets/fonts/FactorA/$f.woff2" "$DS/fonts/"
  cp "$FRONTEND/src/assets/fonts/FactorA/$f.woff"  "$DS/fonts/"
done
for f in Inter-Regular Inter-Medium Inter-SemiBold Inter-Bold Inter-Italic Inter-MediumItalic; do
  cp "$FRONTEND/src/assets/fonts/inter/$f.woff2" "$DS/fonts/"
  cp "$FRONTEND/src/assets/fonts/inter/$f.woff"  "$DS/fonts/"
done
echo "  fonts/            <- src/assets/fonts/{FactorA,inter}"

# --- derived: drift check on theme.ts ----------------------------------------
HASH_FILE="$DS/.theme-ts-hash"
CURRENT="$(shasum -a 256 "$FRONTEND/src/styles/theme.ts" | cut -d' ' -f1)"

if [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE")" != "$CURRENT" ]; then
  echo
  echo "  !! theme.ts changed upstream since theme.css / typography.css were"
  echo "     written by hand. Re-check them against:"
  echo "     $FRONTEND/src/styles/theme.ts"
  echo "     Then run: echo $CURRENT > $HASH_FILE"
  echo
  exit 2
fi

echo "$CURRENT" > "$HASH_FILE"
echo "  theme.ts hash     ${CURRENT:0:12} (derived files up to date)"
echo "done"
