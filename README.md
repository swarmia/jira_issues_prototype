# Jira issues

A single-page app for the Jira issue view, backed by a GraphQL API.

The design prototype it grew out of is still in the repo root (`Issue Details.dc.html`,
`support.js`, `icons/`, `_ds/`) — it is no longer used at runtime. The design system is
synced from the monorepo into `web/public/ds`; icons are served from `web/public/icons`.

## Layout

| Path     | What it is                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| `server` | GraphQL API (graphql-yoga on Node), SQLite storage, metric derivation        |
| `web`    | React + TypeScript SPA (Vite, React Router, Apollo Client)                    |
| `scripts`| Design-system sync from the monorepo, and the token check that guards it      |

## Running it

```sh
npm install
npm run dev
```

- SPA: http://localhost:5173 (Vite takes the next free port if 5173 is busy)
- GraphQL API and GraphiQL: http://localhost:4000/graphql

The database is created and seeded at `server/data/jira-issues.db` on first run, and is
gitignored. `npm run db:reset` deletes it; the next start recreates and reseeds it.

`npm run dev` starts both; Vite proxies `/graphql` to the API, so the browser only ever
talks to one origin. `npm run build` type-checks and builds both, `npm run typecheck`
type-checks only.

### Generate larger test data

```sh
npm run db:generate -- 1000
```

The argument is the **number of new issues** to append. The command initializes the
ordinary seed if needed, then adds issues across eight company projects (platform,
payments, mobile, data, security, growth, integrations, and operations). It generates
nested issues, overlapping source issue types, mapped and unmapped types, varied status
histories, assignees, labels, activity, and daily effort. Repeated runs append new issues
with unique keys. The sample people, project names, and issue content are synthetic.
The Swarmia issue type is assigned as a literal, as with the ordinary seed; the
prototype does not yet evaluate organization issue type filters.
Run `npm run db:reset` to remove the generated data along with the ordinary seed.

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

Basic controls live in `web/src/design-system` and can be explored at
`/design-system`. They adapt the frontend's buttons, inputs, textarea, select,
checkbox, radio, switch, and dropdown to this standalone app. Component styles
are React style objects; the small `web/src/styles/interaction.css` handles
browser states and responsive rules that inline styles cannot express. The app
no longer uses CSS modules.

## The data model

The model is taken from the real implementation in the monorepo (`apps/rapu` and
`packages/common/src/entity/schema`), scoped to the issue lifecycle. The division that
matters is the same one rapu makes: the store holds **source-shaped rows**, and
everything the UI shows about time, progress and hierarchy is a **materialized column**
derived from them.

### Storage

SQLite, through Node's built-in `node:sqlite` — no dependency to install and no native
build step. It is still flagged experimental, so the server scripts pass
`--disable-warning=ExperimentalWarning`.

| Path | What it is |
| --- | --- |
| `server/src/db/schema.sql` | the tables and the `issue_current_status` view, named after their rapu counterparts |
| `server/src/db/database.ts` | connection, first-run schema + seed, in one transaction |
| `server/src/db/seed.ts` | the fixture specs and their expansion into rows |
| `server/src/data/repository.ts` | every SQL statement in the app; the only place column names appear |

Changing `schema.sql` means bumping `SCHEMA_VERSION` in `database.ts`. A database on an
older version refuses to start with a message telling you to run `npm run db:reset` —
migrations would be overkill for a file that is disposable by design.

Two SQLite-shaped compromises: arrays become JSON text (`issues.labels`), and timestamps
are ISO-8601 strings, since SQLite has neither type. The domain layer never sees either —
`repository.ts` maps rows to the camelCase records in `server/src/data/types.ts`.

### What runs in SQL, and what does not

The derivation is split along the line the two languages are each good at:

| In SQL | In `src/domain` |
| --- | --- |
| the hierarchy — `ancestor_ids` and `descendant_ids`, as recursive CTEs | merging in-progress periods into a multirange |
| an issue's current status — the `issue_current_status` view | counting business days for flow efficiency |
| `descendantStatusCounts` — a `GROUP BY` over that view | the effort rollup, scope creep, lifetime |

Anything set-shaped goes to the database; anything time-shaped stays in TypeScript, because
SQLite expresses date arithmetic and range merging badly.

The CTE ordering is not incidental. `descendant_ids` carries a `path` column and sorts by
it, because upstream builds the array as `[self, ...children.flatMap(c => [c.id,
...c.descendantIds])]` — depth-first pre-order, where a plain recursive CTE comes back
breadth-first. `ancestor_ids` sorts by depth, giving the direct parent first up to the root.

### Query counts

Derivation runs per subtree, not per issue, and takes a list of roots — so a page costs the
same eight queries whatever its size:

| Request | Queries |
| --- | --- |
| Issue list, stored fields only | 1 |
| Issue list with derived fields (40 issues, 5 subtrees) | 9 |
| Issue detail with 11 children | 10 |

Nothing is derived until a derived field is actually asked for: `Query.issues` records the
page's roots on the request context, and the first field that needs deriving pulls all of
them through in one pass. Set `DEBUG_SQL=1` to print every statement and check this.

Filtering — status included — happens in SQL through the view, so an issue that fails the
filter is never derived at all.

Annotations, the only table the app writes to, are always queried fresh, so a note survives
a restart.

### Stored — `server/src/data`

| Record | Upstream |
| --- | --- |
| `IssueRecord` | source fields only: `issueKey`, `sourceIssueType`, `priorityLabel`, `labels`, `estimate`, `parentIssueId`, `projectId`, `sourceCreatedAt` |
| `IssueStatusPeriodRecord` | `issue_status_periods` — one contiguous span per source status, `endedAt` null while open |
| `ActivityRecord` | work items (commit, PR, review, comment) — what flow efficiency counts |
| `EffortDailyRecord` | `EffortDaily` — an author's FTE share of a day |
| `AnnotationRecord` | `Annotation` — the polymorphic note entity, titled "Notes" in the UI |
| `IssueSourceInstallationRecord` | installation with its `issue_status_mappings` rows joined on |

Nothing computed is stored. `sourceIssueStatus`, `status`, `startedAt`, `completedAt`,
`inProgressPeriods` and everything downstream are derived on read.

### Derived — `server/src/domain`

| Module | Stands in for |
| --- | --- |
| `status.ts` | the per-installation status mapping |
| `cycleTime.ts` | the `cycleTime` column group — `inProgressPeriods` as a multirange |
| `scopeCreep.ts` | `computeScopeCreep`, transcribed including both null cases |
| `flowEfficiency.ts` | `calculateIssueStatistics` + `extendDateRangeWithLifecycle` |
| `effort.ts` | the `EffortDaily` → `EffortMonthly` rollup |
| `transitions.ts` | `IssueStatusTransition` |
| `issue.ts` | assembles `materialized_swarmia_issues` rows, one pass per set of subtrees |

### Things that are easy to get wrong

- **The status mapping is data, not code.** `issue_status_mappings` is a table, mirroring
  rapu's `jira_issue_status_mappings`, and is resolved per read rather than materialized —
  upstream's stated reason is that remapping a status then takes effect immediately instead
  of needing every affected period recomputed. One known gap: upstream keys on
  `jira_status_id`, which survives a rename; this keys on the status name, which does not.
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
mutation result, and the note now survives a server restart as well as a reload.

## Routes

| Route          | View                                                          |
| -------------- | ------------------------------------------------------------- |
| `/issues`      | Top-level issues; search and the project/status filters run server-side |
| `/issues/:key` | Issue detail; `?tab=activity` selects the activity tab          |
