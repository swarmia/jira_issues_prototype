-- Source-shaped tables, named after their rapu counterparts.
--
-- Only raw facts live here. Nothing computed is stored: `sourceIssueStatus`,
-- `status`, `startedAt`, `completedAt`, `inProgressPeriods` and everything
-- downstream are derived in src/domain, standing in for rapu's materialized
-- columns. The one thing SQLite forces on us is that arrays become JSON text.

PRAGMA foreign_keys = ON;

CREATE TABLE authors (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL
);

-- An author's identity in one issue source. Issues reference the identity, not
-- the author: the same person can have several identities across trackers.
CREATE TABLE author_identities (
  id        TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES authors (id)
);

CREATE TABLE issue_source_installations (
  id          TEXT PRIMARY KEY,
  data_source TEXT NOT NULL CHECK (
    data_source IN ('Jira', 'Linear', 'AzureDevops', 'Shortcut', 'Github')
  ),
  site_url    TEXT NOT NULL
);

-- rapu's `jira_issue_status_mappings`: the per-installation configuration of
-- which tracker statuses mean what. A source status with no row here has no
-- Swarmia status, which is why the lookup is a LEFT JOIN upstream and returns
-- null here.
--
-- Upstream keys on `jira_status_id`, which survives a rename; this keys on the
-- status name, which does not. See README.
CREATE TABLE issue_status_mappings (
  installation_id TEXT NOT NULL REFERENCES issue_source_installations (id),
  source_status   TEXT NOT NULL,
  swarmia_status  TEXT NOT NULL CHECK (
    swarmia_status IN ('TODO', 'IN_PROGRESS', 'DONE', 'WONT_DO')
  ),
  PRIMARY KEY (installation_id, source_status)
);

CREATE TABLE projects (
  id              TEXT PRIMARY KEY,
  installation_id TEXT NOT NULL REFERENCES issue_source_installations (id),
  name            TEXT NOT NULL,
  color           TEXT NOT NULL
);

CREATE TABLE issues (
  id                         TEXT PRIMARY KEY,
  installation_id            TEXT NOT NULL REFERENCES issue_source_installations (id),
  project_id                 TEXT REFERENCES projects (id),
  parent_issue_id            TEXT REFERENCES issues (id),
  source_id                  TEXT NOT NULL,
  source_url                 TEXT NOT NULL,
  issue_key                  TEXT NOT NULL UNIQUE,
  source_issue_type          TEXT NOT NULL,
  source_issue_type_icon_url TEXT,
  -- Swarmia issue type. Null is legitimate: upstream the org's type mappings
  -- fall through to NULL when nothing matches.
  issue_type                 TEXT CHECK (issue_type IN ('Bug', 'Epic', 'Story', 'Task')),
  priority_label             TEXT,
  -- JSON array: SQLite has no array type.
  labels                     TEXT NOT NULL DEFAULT '[]',
  estimate                   REAL,
  title                      TEXT NOT NULL,
  description                TEXT,
  assignee_identity_id       TEXT REFERENCES author_identities (id),
  source_created_at          TEXT NOT NULL,
  source_updated_at          TEXT NOT NULL
);

-- One contiguous span in one source status. `ended_at` is null while the issue
-- is still in the status — the unbounded upper of rapu's tstzrange, and not the
-- same thing as a zero-length period.
CREATE TABLE issue_status_periods (
  id            TEXT PRIMARY KEY,
  issue_id      TEXT NOT NULL REFERENCES issues (id),
  source_status TEXT NOT NULL,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  author_id     TEXT NOT NULL REFERENCES authors (id)
);

-- Work items. This is what flow efficiency counts, and it rolls up the ancestor
-- chain, so a commit on a child marks its parent's day active too.
CREATE TABLE activities (
  id             TEXT PRIMARY KEY,
  issue_id       TEXT NOT NULL REFERENCES issues (id),
  author_id      TEXT NOT NULL REFERENCES authors (id),
  timestamp      TEXT NOT NULL,
  work_item_type TEXT NOT NULL CHECK (
    work_item_type IN ('Commit', 'PullRequest', 'Review', 'Comment')
  )
);

CREATE TABLE effort_daily (
  id        TEXT PRIMARY KEY,
  issue_id  TEXT NOT NULL REFERENCES issues (id),
  author_id TEXT NOT NULL REFERENCES authors (id),
  date      TEXT NOT NULL,
  fte       REAL NOT NULL
);

-- rapu's polymorphic `Annotation`. The only table this app writes to.
CREATE TABLE annotations (
  id                 TEXT PRIMARY KEY,
  target_entity_type TEXT NOT NULL,
  target_entity_id   TEXT NOT NULL,
  content            TEXT NOT NULL,
  source             TEXT NOT NULL CHECK (source IN ('Ui', 'SwarmiaAi', 'GithubBotPing')),
  author_id          TEXT NOT NULL REFERENCES authors (id),
  timestamp          TEXT NOT NULL
);

CREATE INDEX issues_parent_issue_id ON issues (parent_issue_id);
CREATE INDEX issues_project_id ON issues (project_id);
CREATE INDEX issue_status_periods_issue_id ON issue_status_periods (issue_id, started_at);
CREATE INDEX activities_issue_id ON activities (issue_id);
CREATE INDEX effort_daily_issue_id ON effort_daily (issue_id);
CREATE INDEX annotations_target ON annotations (target_entity_type, target_entity_id);

-- rapu's `status` materialized column group, as a view.
--
-- The issue's current status is the source status of its open period (the one
-- with no end), resolved through the installation's mapping. Both halves are
-- exposed because they answer different questions: `source_issue_status` is what
-- the team calls it, `status` is what Swarmia counts it as — and `status` is
-- NULL when the source status is unmapped, which is the LEFT JOIN doing the same
-- job it does upstream.
--
-- A view rather than a stored column, for the reason rapu gives for resolving
-- the mapping per read: remapping a status then takes effect immediately instead
-- of needing every affected row recomputed.
CREATE VIEW issue_current_status AS
SELECT
  issues.id                AS issue_id,
  issues.installation_id   AS installation_id,
  latest.source_status     AS source_issue_status,
  mappings.swarmia_status  AS status
FROM issues
LEFT JOIN issue_status_periods latest
  ON latest.id = (
    SELECT id
    FROM issue_status_periods
    WHERE issue_id = issues.id
    -- `rowid` breaks ties between periods that start at the same instant,
    -- keeping the view deterministic.
    ORDER BY started_at DESC, rowid DESC
    LIMIT 1
  )
LEFT JOIN issue_status_mappings mappings
  ON mappings.installation_id = issues.installation_id
  AND mappings.source_status = latest.source_status;
