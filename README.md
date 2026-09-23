# Jira issues

A single-page app for the Jira issue view, backed by a GraphQL API.

The design prototype it grew out of is still in the repo root (`Issue Details.dc.html`,
`support.js`, `icons/`, `_ds/`) — it is no longer used at runtime. The design system is
synced from the monorepo into `web/public/ds`; icons are served from `web/public/icons`.

## Layout

| Path     | What it is                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| `server` | GraphQL API (graphql-yoga on Node), in-memory data, metric derivation         |
| `web`    | React + TypeScript SPA (Vite, React Router, Apollo Client)                    |
| `scripts`| Design-system sync from the monorepo, and the token check that guards it      |

## Running it

```sh
npm install
npm run dev
```

- SPA: http://localhost:5173 (Vite takes the next free port if 5173 is busy)
- GraphQL API and GraphiQL: http://localhost:4000/graphql

`npm run dev` starts both; Vite proxies `/graphql` to the API, so the browser only ever
talks to one origin. `npm run build` type-checks and builds both, `npm run typecheck`
type-checks only.

## The design system

`web/public/ds` is synced from the Swarmia monorepo (`apps/frontend`) rather than
hand-maintained, and is linked once from `web/index.html`:

```sh
npm run sync-ds                      # defaults to ../monorepo/apps/frontend
npm run sync-ds -- /path/to/frontend
```

Color tokens and font files are copied verbatim. `theme.css`, `typography.css` and
`fonts.css` are transcribed by hand, because upstream they are a styled-system theme
object and LESS with no CSS-variable form to copy — so the sync pins the hash of
`theme.ts` and stops if it has moved, rather than letting them drift silently.

Tokens keep the monorepo's names: `--textPrimary`, `--surfaceHover`, `--radiusMedium`,
`--space16`. `scripts/check-design-tokens.py` fails the build if the app references a
token the design system does not define, which is what catches an upstream rename. See
`web/public/ds/README.md` for the full layout.

## The data model

The model is taken from the real implementation in the monorepo (`apps/rapu` and
`packages/common/src/entity/schema`), scoped to the issue lifecycle. The division that
matters is the same one rapu makes: the store holds **source-shaped rows**, and
everything the UI shows about time, progress and hierarchy is a **materialized column**
derived from them.

### Stored — `server/src/data`

| Record | Upstream |
| --- | --- |
| `IssueRecord` | source fields only: `issueKey`, `sourceIssueType`, `priorityLabel`, `labels`, `estimate`, `parentIssueId`, `projectId`, `sourceCreatedAt` |
| `IssueStatusPeriodRecord` | `issue_status_periods` — one contiguous span per source status, `endedAt` null while open |
| `ActivityRecord` | work items (commit, PR, review, comment) — what flow efficiency counts |
| `EffortDailyRecord` | `EffortDaily` — an author's FTE share of a day |
| `AnnotationRecord` | `Annotation` — the polymorphic note entity, titled "Notes" in the UI |
| `IssueSourceInstallationRecord` | holds the source-status → Swarmia-status mapping |

Nothing computed is stored. `sourceIssueStatus`, `status`, `startedAt`, `completedAt`,
`inProgressPeriods` and everything downstream are derived on read.

### Derived — `server/src/domain`

| Module | Stands in for |
| --- | --- |
| `status.ts` | the per-installation status mapping |
| `cycleTime.ts` | the `cycleTime` column group — `inProgressPeriods` as a multirange |
| `hierarchy.ts` | `ancestors`, `descendants`, `descendantStatusCounts` |
| `scopeCreep.ts` | `computeScopeCreep`, transcribed including both null cases |
| `flowEfficiency.ts` | `calculateIssueStatistics` + `extendDateRangeWithLifecycle` |
| `effort.ts` | the `EffortDaily` → `EffortMonthly` rollup |
| `transitions.ts` | `IssueStatusTransition` |
| `issue.ts` | assembles one `materialized_swarmia_issues` row |

### Things that are easy to get wrong

- **Status is two fields.** `sourceIssueStatus` is the raw tracker string; `status` is the
  Swarmia enum, and it is **nullable** — a source status nobody mapped has no Swarmia
  status. "Waiting for QA" is deliberately left unmapped in the fixtures: it shows in the
  timeline with its real duration but drives no metric.
- **`WONT_DO` is terminal but is not a completion.** It leaves scope entirely — neither
  outstanding nor completed work — and is excluded from the scope-creep ratio.
- **Null is not zero.** `inProgressTimeSeconds` is null when the issue never started, not
  0. `scopeIncrease` is null when the issue never started *or* had no initial children; a
  real 0 means it started with children and nothing crept in.
- **In-progress periods merge.** In Progress → In Review → Blocked → In Progress is one
  continuous multirange member, not four.
- **Flow efficiency counts days, not time.** Days with work-item activity over the
  business days in the activity window, plus weekend days that were worked. It is *not*
  time-in-active-status over cycle time, and activity rolls up the ancestor chain, so a
  commit on a child marks the parent's day active.
- **`descendantStatusCounts` includes the issue itself**, which is what makes
  `isLeafIssue` equal `descendantIds.length === 1`.

Two deliberate departures, both because the prototype has no organization: everything is
computed in UTC rather than an org timezone, and `burnup` is derived from children (rapu
has no burn-up column) rather than stored.

```graphql
query {
  issue(issueKey: "DUM-8829") {
    sourceIssueStatus
    status
    inProgressTimeSeconds
    flowEfficiency
    scopeIncrease
    statusPeriods { sourceStatus status durationInSeconds }
    descendantStatusCounts { todo inProgress done wontDo }
  }
}
```

Writes go through `addAnnotation` / `deleteAnnotation`; the Apollo cache updates from the
mutation result, and the note survives a reload. Data lives in memory
(`server/src/data/fixtures.ts`) and resets when the server restarts.

## Routes

| Route          | View                                                          |
| -------------- | ------------------------------------------------------------- |
| `/issues`      | Top-level issues; search and the project/status filters run server-side |
| `/issues/:key` | Issue detail; `?tab=activity` selects the activity tab          |
