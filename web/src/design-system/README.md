# Basic components

Each control has its own folder and component file. `controls.tsx` re-exports them
from one import path. They adapt the corresponding components in
`../monorepo/apps/frontend/src/components`:
`Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Radio`, `Switch`, and
`Dropdown`. The upstream components use Ant Design, styled-components, analytics,
and other app services that this prototype does not ship. The standalone controls
keep the upstream names, principal variants, sizes, and token choices while using
native HTML controls where possible.

Use the components from `./controls`. The `/design-system` route shows the
available variants and interactive states. Existing issue filters and the notes
composer also use them.

`Select` keeps native single-choice behavior by default. Pass `mode="checkbox"`,
`options`, a controlled `string[]` value, and `onValuesChange` for a multiple-choice
popover. Its checkboxes stay open while selecting; outside input and Escape close it.

Each control composes typed utility names inline with `sx()`. `utilities.ts`
maps those names to the synced design tokens and keeps the few dimensions
missing from the upstream scale in one place. Add a
shared utility there when a control needs a new static style. Browser selectors
needed for hover, focus, disabled, switch thumbs, animation, and responsive layout
live in `../styles/interaction.css`. It uses `data-ui` markers for those states.
Keep that file small.

`npm run sync-ds` still syncs only tokens and fonts. When upstream component
behavior changes, review the named source component and update these local
adapters deliberately.
