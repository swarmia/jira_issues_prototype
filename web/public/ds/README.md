# Design system

Synced from the Swarmia monorepo (`apps/frontend`). Linked once, from
`web/index.html`, as `/ds/styles.css`.

This folder replaced a hand-reconstructed design-system bundle that had drifted
from the monorepo — it was missing the whole `label*` token family and the
chart `data*500/700` scale, had two stale button-text values, and invented token
names (`--radius-tiny`, `--radius-bubble`, `--space-1…10`) that do not exist
upstream. Everything here is now either copied verbatim or transcribed from a
named source file.

## Files

| File              | Origin                                                        |
| ----------------- | ------------------------------------------------------------- |
| `colors.css`      | **copied** from `src/styles/colors/generated/theme-css-light.css` |
| `fonts/`          | **copied** from `src/assets/fonts/{FactorA,inter}`             |
| `fonts.css`       | derived from `src/theme/fonts.less`                            |
| `theme.css`       | derived from `src/styles/theme.ts` + `src/styles/stylePropTypes.ts` |
| `typography.css`  | derived from the `fontVariants` export in `src/styles/theme.ts` |
| `styles.css`      | entry point; imports the four above in order                   |

**Copied** files must never be edited here — re-run the sync instead. **Derived**
files are hand-written, because upstream they are a styled-system theme object
and LESS, neither of which has a CSS-variable form to copy.

## Syncing

```sh
./scripts/sync-design-system.sh [path-to-apps/frontend]   # defaults to ../monorepo/apps/frontend
```

The script refreshes the copied files and pins the hash of `theme.ts` in
`.theme-ts-hash`. If `theme.ts` has changed upstream, the script stops and tells
you to re-check `theme.css` and `typography.css` by hand — the derived files
cannot follow automatically.

```sh
./scripts/check-design-tokens.py    # every var(--x) in web/src resolves to a real token
```

This runs as part of `npm run build` and `npm run typecheck`.

## Token naming

Tokens use the monorepo's names verbatim: `--textPrimary`, `--surfaceHover`,
`--buttonPrimaryBg`. Scale tokens are named by value — `--space16`,
`--fontSize14`, `--lineHeight20` — because that is how the monorepo refers to
them (`paddingX={16}`), and a t-shirt-size indirection invented here would not
survive the next sync.

Two names are worth knowing because they are easy to guess wrong:

- the page background is **`--mainBackground`** (white), not `--surfaceDefault`,
  which is `transparent`
- the default link color is **`--textLinkDefault`**, not `--textLink`

## Typography

`typography.css` exposes each upstream `fontVariants` entry as a class of the
same name — `.h1`, `.normalLabel`, `.smallLabel`, `.code`, `.chartAxisLabel`.
Prefer these over hand-rolled `font-size` / `line-height` pairs: they are the
only thing keeping type in step with the monorepo.

## Light theme only

The monorepo ships a full dark palette (`colors-dark.ts`), applied through a
`.theme-light` / `.theme-dark` wrapper by `ThemeModeProvider`. This prototype
deliberately ships light only. To add dark later: have the sync script also copy
`theme-css-dark.css`, rewrite its `:root` selector to `.theme-dark`, and put that
class on `<body>`.
