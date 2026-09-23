#!/usr/bin/env python3
"""Fail if the app references a CSS variable the design system does not define.

The design system in web/public/ds is synced from the monorepo, so a token can
disappear upstream between syncs. This catches that at build time instead of as
a silently unstyled element in the browser.

Usage:  ./scripts/check-design-tokens.py
"""
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DS = ROOT / "web" / "public" / "ds"
# The server is scanned too: board colors are stored there as token strings and
# handed to the client as CSS, so an upstream rename breaks them just the same.
SRC_DIRS = [ROOT / "web" / "src", ROOT / "server" / "src"]

# Tokens the design system defines.
defined = set()
for css in ("colors.css", "theme.css"):
    defined |= set(re.findall(r"^\s*(--[A-Za-z0-9-]+)\s*:", (DS / css).read_text(), re.M))

# Tokens the app references, ignoring the fallback half of var(--x, fallback).
missing = {}
sources = sorted(p for d in SRC_DIRS for p in d.rglob("*") if p.suffix in {".css", ".ts", ".tsx"})
for path in sources:
    for lineno, line in enumerate(path.read_text().splitlines(), 1):
        for token in re.findall(r"var\(\s*(--[A-Za-z0-9-]+)", line):
            if token not in defined:
                missing.setdefault(token, []).append(f"{path.relative_to(ROOT)}:{lineno}")

if missing:
    print(f"{len(missing)} undefined design token(s):\n", file=sys.stderr)
    for token, uses in sorted(missing.items()):
        print(f"  {token}", file=sys.stderr)
        for use in uses:
            print(f"      {use}", file=sys.stderr)
    print("\nEither the token was renamed upstream, or this is a typo.", file=sys.stderr)
    sys.exit(1)

print(f"all design token references resolve ({len(defined)} tokens defined)")
