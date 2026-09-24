# Jira issues prototype

A single-page app for the Jira issue view, backed by a GraphQL API over SQLite. Two
workspaces: `server` (graphql-yoga, storage, metric derivation) and `web` (React, Vite,
Apollo). `scripts/` holds the design-system sync and the checks that guard it.

The README explains *what* the model is. This file is about *how not to break it*.

## Code comments

Document every significant module and component in the source file itself. Treat a module
as significant when it owns a domain rule, data transformation, API boundary, query,
cache, page, or reusable UI behavior. Add a file-level comment that explains its purpose,
what it receives and produces, how it fits into the surrounding data flow, and the
invariants or side effects a maintainer must preserve. For React components, also explain
the important props, state, and user interactions. For SQL, explain non-obvious joins,
ordering, and null behavior next to the relevant query or view.

Give complex functions and algorithms their own comments. Walk through the reasoning,
edge cases, units, ordering, and assumptions that are not clear from the code. Explain
*why* a rule exists and cite its upstream source when porting it from the monorepo. Use
small inline comments at the point where a surprising branch or constraint matters.
Comments should help a reader follow the implementation without reverse-engineering it;
do not merely restate names or describe each line.

When changing documented behavior, update the nearby comments in the same change. Keep
comments accurate to the code and its current constraints. These requirements apply to
new significant modules and components and to existing ones when you work on them.
Copied design-system files remain untouched; document our integration code instead.

## Locality over reuse

Prefer self-contained views and modules that can be understood and changed in isolation.
DRY, single-responsibility rules, and similar design heuristics are not goals by
themselves. It is fine to repeat the code, or reimplement a simple helper,
when sharing it would couple otherwise separate views or force a change in one view to
affect another. Keep view-specific rendering, state, styles, and transformations near the
view that uses them. Do not extract a shared abstraction solely because two pieces of code
look alike today.

Share code when it represents a genuine common contract or a domain invariant that must
stay consistent, such as the issue lifecycle rules, GraphQL schema, repository boundary,
or design-system tokens. If duplication starts to obscure those rules or causes behavior
to diverge unintentionally, consolidate that part. Optimize for independent changes and
clear local reasoning rather than the fewest lines of code.

## Commands

Run from the repo root.

- `npm run dev` — both workspaces; SPA on :5173, API and GraphiQL on :4000.
- `npm run build` / `npm run typecheck` — both run `scripts/check-design-tokens.py` first.
- `npm run sync-ds` — re-copy the design system from `../monorepo/apps/frontend`.
- `npm run db:reset` — delete the database; the next start recreates and seeds it.
- `DEBUG_SQL=1 npm run dev -w server` — print every SQL statement, with a running count.

There is no test suite. Verify by running the app (see **Verification**).

## Design system

`web/public/ds` is **synced, not hand-maintained**. Two kinds of file live there and they
have different rules:

- **Copied** (`colors.css`, `fonts/`) — never edit. Re-run `npm run sync-ds`.
- **Derived** (`theme.css`, `typography.css`, `fonts.css`) — hand-written from
  `theme.ts` / `fonts.less`, which have no CSS-variable form upstream. The sync pins
  `theme.ts`'s hash in `.theme-ts-hash` and **exits 2** when upstream moves; re-check the
  derived files by hand, then update the hash.

Tokens use the monorepo's names verbatim — `--textPrimary`, `--surfaceHover`,
`--radiusMedium`, `--space16`. Scale tokens are named by value because that is how the
monorepo refers to them (`paddingX={16}`); do not invent t-shirt sizes.

Three that are easy to guess wrong:

- page background is `--mainBackground`, **not** `--surfaceDefault` (that one is `transparent`)
- the default link colour is `--textLinkDefault`, not `--textLink`
- `--radiusXLarge` exists; `--radius-tiny` and `--radius-bubble` do not

`scripts/check-design-tokens.py` fails the build on any `var(--x)` the design system does
not define. It scans **`server/src` as well as `web/src`**, because project colours are
stored server-side as token strings — a rename that only sweeps the web app leaves those
dangling and silently unstyled.

Prefer the `typography.css` classes (`.h1`, `.normalLabel`, `.smallLabel`, `.code`) over
hand-rolled `font-size`/`line-height` pairs. A few pre-existing values are off-scale
(`15px`, `line-height: 28px`); do not copy them.

## Data model

Ported from `../monorepo/apps/rapu` and `packages/common/src/entity/schema`, scoped to the
issue lifecycle. The rule that holds the whole thing together:

**The database stores source-shaped rows. Nothing computed is stored.** `sourceIssueStatus`,
`status`, `startedAt`, `completedAt`, `inProgressPeriods` and everything downstream are
derived on read, standing in for rapu's materialized columns. If you find yourself adding a
column for something the domain layer can compute, stop.

Invariants worth failing a review over:

- **Status is two fields.** `sourceIssueStatus` is the raw tracker string; `status` is the
  Swarmia enum and is **nullable** — an unmapped source status has no Swarmia status,
  shows its real duration in the timeline, and drives no metric. "Waiting for QA" is left
  unmapped in the seed on purpose; do not "fix" it.
- **`WONT_DO` is terminal but is not a completion.** It leaves scope entirely and is
  excluded from the scope-creep ratio.
- **Null is not zero.** `inProgressTimeSeconds` is null when the issue never started.
  `scopeIncrease` is null when it never started *or* had no initial children; a real `0`
  means it started with children and nothing crept in. Never coalesce these.
- **In-progress periods merge.** In Progress → In Review → Blocked → In Progress is one
  multirange member, not four.
- **Flow efficiency counts days, not time** — days with activity over business days in the
  window, plus worked weekend days. It is *not* active-status-time over cycle time, and
  activity rolls up the ancestor chain.
- **`descendantStatusCounts` includes the issue itself.** That is what makes `isLeafIssue`
  equal `descendantIssueIds.length === 1`. Subtract the issue's own status before showing
  the number next to a list of children.

## Database

Node's built-in `node:sqlite` — no dependency, no native build. It is experimental, so the
server scripts pass `--disable-warning=ExperimentalWarning`; keep that on any new script
that boots the server.

- `src/db/schema.sql` is the one readable artifact. `tsc` does not copy it — the build
  script does, so a new non-`.ts` file under `src/` needs the same treatment.
- **Changing `schema.sql` means bumping `SCHEMA_VERSION` in `database.ts`.** A database on
  an older version refuses to start and tells you to run `npm run db:reset`. There are no
  migrations; the file is disposable by design.
- `src/data/repository.ts` is the only module that may contain SQL or column names.
  Everything above it sees camelCase records from `src/data/types.ts`.
- SQLite has no array or timestamp type: arrays are JSON text (`issues.labels`), timestamps
  are ISO-8601 strings. The repository absorbs both.

The seed uses a PRNG seeded off each issue key, so activity and effort are identical across
restarts. **Editing `src/db/seed.ts` changes the flow-efficiency numbers** — expect
screenshots and any recorded figures to move.

## SQL vs TypeScript

The derivation is split deliberately:

- **SQL** — set-shaped work: the hierarchy (recursive CTEs), an issue's current status (the
  `issue_current_status` view), the status tally (`GROUP BY` over that view), and all
  filtering.
- **TypeScript** (`src/domain`) — time-shaped work: merging ranges, counting business days,
  rolling up effort, scope creep, lifetime. SQLite expresses these badly.

Keep new work on the right side of that line.

Two CTE details that are load-bearing: `descendant_ids` sorts by a `path` column to get
depth-first pre-order with self first (a plain recursive CTE returns breadth-first, which
does not match upstream); `ancestor_ids` sorts by depth to get direct-parent-first.

**Derivation runs per subtree, batched across roots** — one pass costs eight queries
regardless of how many roots or how deep. Nothing derives until a derived field is asked
for: `Query.issues` records the page's roots on the request context and the first derived
field pulls them all through. Adding a per-issue query reintroduces an N+1 that this
structure exists to avoid. Check with `DEBUG_SQL=1`; current numbers are 1 query for a
stored-fields-only list, 9 for the full list, 10 for a detail page with 11 children.

`RequestContext` pins one `now` and one materialization cache per request. Every duration on
an open range is measured against it — resolvers must not call `new Date()` themselves.

## Web app

- Apollo normalizes `Issue` on **`issueKey`**, not `id` (`web/src/gql/client.ts`). Renaming
  a field used in `keyFields` fails at runtime with an opaque Apollo invariant error, not at
  compile time.
- `IssueStatusPeriod` and `IssueStatusTransition` set `keyFields: false` — their ids are
  only unique within an issue.
- Types in `web/src/gql/types.ts` are hand-written to mirror the server schema. There is no
  codegen; change both sides together.

## Porting more from the monorepo

When bringing over another piece of rapu:

- **Transcribe the algorithm, do not approximate it**, and name the source file in a
  comment. The null cases and ordering rules usually carry the meaning — `computeScopeCreep`
  has two distinct nulls, `calculateIssueStatistics` floors its denominator at 1.
- Read the upstream comments. Several decisions here exist only because rapu explains them
  (status mapping resolved per read so a remap takes effect immediately; `ORDER BY
  swarmia_issue_type` because overlapping filters make the CASE order-dependent).
- Check whether the thing is materialized or resolved per read upstream, and match it.

## Known gaps

- **Status mapping is keyed by status name**; upstream (`jira_issue_status_mappings`) keys
  on `jira_status_id`, which survives a rename. Adding `source_status_id` to
  `issue_status_periods` and the mapping table would close it.
- **Issue type mapping is not implemented.** `issue_type` is a literal in the seed.
  Upstream is org-wide rows of `(swarmia_issue_type, issue_filter)` compiled into a
  first-match-wins `CASE`, not a name lookup — implementing it properly needs an
  issue-filter predicate evaluator.
- Deliberate departures, both because the prototype has no organization: everything is
  computed in **UTC** rather than an org timezone, and `burnup` is derived from children
  (rapu has no burn-up column).
