# Swarmia Design System

A working design-system folder for **Swarmia** — a B2B engineering productivity platform used by software teams and engineering leaders to balance investment, improve developer experience, and ship faster.

This folder bundles brand fonts, color tokens, semantic CSS, real product icons, logos, and a hi-fi UI kit recreating the actual Swarmia app, so a designer or design agent can produce on-brand artifacts (mockups, prototypes, slides, marketing pages) without having to re-derive the system every time.

---

## Sources

This system was reconstructed from materials the user attached. None of these are guaranteed to be readable by future readers — always check the project filesystem first.

- **Figma file** — `🔩 DS_ Core (Swarmia Design System).fig` (mounted virtual filesystem). Contains the canonical typography, tokens, components, charts, tables, and screen patterns. Top-level pages: `/Logo`, `/Typography`, `/Tokens`, `/Avatar`, `/Icon`, `/Button`, `/Input`, `/Tag`, `/Tooltip`, `/Modal`, `/Form`, `/Charts`, `/Table`, `/Lists`, `/Issues`, `/Pull-requests`, `/Issue-PR-linking-UI`, `/Tabs-group-items`, `/Navigation`, `/Layout`, `/Progress-indicator`, etc.
- **Codebase** — `swarmia/monorepo @ master` (`apps/frontend/` subtree). The source of truth for tokens lives in `apps/frontend/src/styles/theme.ts` and `apps/frontend/src/styles/colors/colors.ts`. A subset of those files is copied into this project under `apps/frontend/src/styles/` for reference.
- **Fonts** — Provided directly by the user (Factor A, Inter). Files live under `fonts/`.
- **Logos** — Imported from `apps/frontend/src/assets/logo/` and the Figma `/Logo` page. Files live under `assets/`.

---

## What Swarmia is

Swarmia helps engineering teams **balance investment**, **improve developer experience**, and **ship faster — even as they grow**. The product is a dashboard-and-workflow tool used by both ICs (their personal overview, working agreements, PR/issue lists) and engineering leaders (initiative forecasts, investment balance, business outcomes, surveys, AI impact). It integrates with GitHub, GitLab, Jira, Linear, Slack, Microsoft Teams, Okta and others.

Surfaces represented:
- **App** — the authenticated product (sidebar, dashboards, issue lists, PR lists, charts, tooltips, filters). The main UI kit in `ui_kits/app/` is a hi-fi recreation.
- **Slack templates / messaging** — patterns exist in the Figma but were not part of this build.
- **Marketing website** is a separate repo (`swarmia/website`) and out of scope for this kit.

---

## Index

```
README.md                  ← this file
SKILL.md                   ← agent-skill manifest
colors_and_type.css        ← CSS custom properties + semantic type classes
fonts/                     ← Factor A (display) + Inter (UI) + Inter Italic
assets/                    ← Logos + brand mark SVGs
preview/                   ← Design-system tab cards (one HTML per concept)
ui_kits/
  app/                     ← Hi-fi app recreation (sidebar, PR list, charts, etc.)
    index.html             ← Click-thru prototype
    components/*.jsx       ← Modular React components
    README.md
apps/frontend/src/styles/  ← Reference copy of source-of-truth theme files
```

---

## Content fundamentals

Swarmia copy is **direct, helpful, and precise**. It reads like a well-run engineering team's internal docs, not a marketing page.

- **Voice** — Confident and informational. Short sentences. Verbs do the work. No hype words, no emoji.
- **Casing** — Sentence case for titles, button labels, menu items ("Add target", "Invite teammate"). UPPERCASE only for `H6`-style section labels and `text-transform: uppercase` keys (status pill labels like `IN PROGRESS`, "PULL REQUESTS" group headers).
- **Person** — Mostly third-person about the team ("Your team merged 12 PRs"), occasionally second-person ("You haven't connected Jira yet"). Avoid first-person "we" except in onboarding and contact flows ("We'll email you when…").
- **Density** — Labels are short (one or two words). Tooltips are full sentences but no longer than they need to be. Empty states are *actionable* — they tell you what to do next, not what's missing.
- **Numbers** — Always show the unit (`6d`, `+191`, `–21`, `42%`, `12 PRs`). Deltas use `+` / `–` with semantic color (positive green, negative red, neutral gray). Tabular figures wherever numbers stack.
- **Status & state** — Specific labels (`IN PROGRESS`, `IN REVIEW`, `MERGED`, `STALE`, `BLOCKED`) over generic ("Active"). Pills are small, uppercase, neutral background, never decorative.
- **Emoji** — Not used in product UI. Some illustrations exist in onboarding flows but iconography is the dominant non-text element.

Examples (verbatim from the Figma):
- *"To visualize your work, tell us what columns in your Jira contain issues planned, in progress or completed. You can choose multiple columns for each status, and the issues will be combined."*
- *"Tell us about your organization and tech stack for us to personalize your setup."*
- *"Swarmia helps teams to balance engineering investment, improve developer experience, and ship faster — even as you grow."*
- *"Faster cycle times help avoid context switching, get feedback…"*

---

## Visual foundations

**Type** — Two families, no exceptions.
- **Factor A** for display, headings (H1–H6), and the button label. Bold (700) for headings, Medium (500) for buttons and the H6 label style, Regular (400) for the rare "medium" body.
- **Inter** for all UI body, labels, table cells, tooltips, code-prose runs. Medium (500) is the default UI weight; 700 is used for emphasis (PR delta numbers, table key columns); 400 for prose; 600 only on rare tags.
- **SF Mono / system mono** for code and inline code. `13px / 20px`, color `--text-code` (`#0a328f`), background `--surface-hover` (`#f0f4fa`), 1px stroke `--stroke-dark`, `radius-small` (3px).

**Color** — Restrained. The palette is **white + a deep ink (`#1e212a`)** anchored on a **cool blue-leaning gray scale**. Accents are *purposeful*: purple (`#6252e2`) is the *only* primary action color; green/red are reserved for positive/negative deltas; blue (`#1a66d8`) is for links and informational data. **No gradients anywhere in product UI.** Charts use a separate, low-saturation data palette (lightblue, green, lightpurple, coffee, pink, red, purple, blue, tan, yellow) plus a fallback `strokeLight` gray.

**Spacing** — Powers of two: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`. Inputs and rows hover around 32–40px tall — **tight by SaaS standards**. Pages have generous outer margins but rows themselves are dense.

**Backgrounds** — Almost always plain white (`--surface-page`). Hover surfaces are a near-imperceptible cool blue (`#f0f4fa`). Selected surfaces step to `#e1e6f5`. **No textures, no patterns, no full-bleed photography in product chrome.** Onboarding and marketing screens occasionally show illustrations (separate folder in monorepo, not bundled here). The brand mark + a subtle pattern SVG exist in `apps/frontend/src/assets/logo/` for off-product surfaces.

**Animation** — Single global default: `0.2s ease`. Used for hover color shifts, accordion expansions, and sidebar collapse. **No bounces, no scale-ups, no fade-in cascades.** Spinners use a 1s linear rotate.

**Hover states** — Cool-blue tinted surface (`--surface-hover`). Text rarely changes color on hover; instead the row gets the tint. Buttons use a slightly darker variant of their bg color.

**Press / active states** — Active focus uses a 2px outer ring at 20% blue (`--shadow-active`). Destructive uses the same pattern with red. No press-down "shrink" animation.

**Borders** — 1px is the only width that ships in production. `--stroke-light` (`#e1e6f5`) for table rows and dividers, `--stroke-dark` (`#c6d1eb`) for inputs and code blocks. Borders carry the structure; shadows are reserved for actually-elevated surfaces.

**Shadows** — Five shadows total, all subtle.
- `paper-1` and `small` for cards sitting on the page.
- `medium` and `large` for popovers, tooltips, modals.
- `active` and `error` for focus rings.
- `inputLarge` is an *inset* shadow on large inputs.
Never used decoratively.

**Corner radii** — `tiny: 2`, `small: 3` (inline code, tags), `medium: 6` (buttons, rows, inputs), `large: 12` (cards, panels), `bubble: 24` (chat-like surfaces only), `round: 9999` (avatars, status dots). Cards are `radius-large` with no border by default — a 1px border only appears in dark theme.

**Cards** — White surface, `radius: 12`, `shadow: paper-1` or no shadow at all, no border in light theme. Title in `H3`/Factor A 20/24 700; body in Inter Medium 14/20.

**Layout rules** — Fixed sidebar at `220px`, fixed top of page header. Content max-width `1440px`, min-width `1040px`. Tables and charts are first-class citizens — they do not get capped to a narrower text column.

**Transparency / blur** — Used sparingly. Tooltips use `--surface-tooltip` (`#1e212a` 90% opacity in legacy, opaque in new). No backdrop blur in product chrome. The "audio mode highlight" and "menu background active" tokens are the only places translucent overlays appear.

**Imagery vibe** — Cool, neutral, almost never people-as-photo. Onboarding illustrations (in monorepo, not bundled) are flat, low-saturation, with the same purple/blue/black palette as the product. Avatars are circular, 1px white border, `--purple-400`/etc fill when no photo.

---

## Iconography

Swarmia uses an **internal SVG icon system** — there is no icon font, and emoji are not used as icons. The Figma file ships ~200 distinct icons across two sizes (`16×16`, `24×24`) plus product-specific icons (issue type by tracker, integration logos for GitHub/GitLab/Jira/Linear/Slack/MS Teams/Okta/Google/Microsoft/Claude/Copilot/Cursor).

Naming convention: `X16<name>16` / `X24<name>24` for size-keyed icons (e.g. `X16Search16`, `X24Calendar24`); `Type<name>` for navigation and feature icons (`TypeHome`, `TypeInsights`, `TypePullRequests`, `TypeAIImpact`, `TypeAgents`, `TypeBalance`); `IssueTracker<system>Type<kind>` for tracker-aware issue type icons (`IssueTrackerJIRATypeEpic`, `IssueTrackerLinearTypeProject`).

Stroke style: **flat fills + light strokes**, 1.5–2px equivalent, square caps, geometric. Colors are token-driven — most icons inherit `currentColor` and pick up the surrounding text token.

For this design system: a curated set of working icons is included in `assets/icons/` (copied programmatically from the Figma where possible). For new icons, prefer matching the existing weight first; fall back to **Lucide** (`lucide.dev`) at 1.5px stroke as a close visual match. **Do not redraw icons by hand.**

Unicode chars are used only for math/typography (`+`, `–`, `↗`, `→`, `…`) — never as decorative icons.

---

## Caveats & next steps

- **Icons** — Only a small subset of the 200+ icons in the Figma are bundled. If the design needs an icon not present, prefer Lucide as a near match and flag the substitution. The full set lives in `/Icon/components/*` in the Figma virtual filesystem.
- **Dark theme** — Tokens are defined for dark theme in the codebase (`apps/frontend/src/styles/colors/colors-dark.ts`, `theme-css-dark.css`) but the UI kit only renders the light theme. To add dark theme, swap the `:root` variables in `colors_and_type.css` for the dark variants.
- **Slack template, communication, and survey screens** — Pages exist in the Figma but are out of scope for this build.
- **Marketing site** — Lives in a separate repo (`swarmia/website`); not represented here.
