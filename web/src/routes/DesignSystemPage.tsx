import { useState, type CSSProperties } from 'react';
import {
  Button, Checkbox, Dropdown, Input, Radio, Select, Switch, TextArea,
} from '../design-system/controls';
import { buttonSizes, buttonVariants } from '../design-system/variants';

/**
 * Interactive catalog of local control adapters. It receives no data and keeps only
 * demo state; changing a control here makes its appearance and user interactions
 * visible without changing the issue pages. The checkbox select deliberately keeps
 * its values in this page because the popover unmounts while closed.
 */
const page: CSSProperties = { maxWidth: 960, paddingBottom: 'var(--space64)' };
const section: CSSProperties = { marginTop: 'var(--space32)', padding: 'var(--space24)', border: '1px solid var(--strokeLight)', borderRadius: 'var(--radiusLarge)', background: 'var(--mainBackground)' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space16)', marginTop: 'var(--space16)' };
const label: CSSProperties = { display: 'grid', gap: 'var(--space8)', minWidth: 180, color: 'var(--textSecondary)' };

export function DesignSystemPage() {
  const [text, setText] = useState('');
  const [project, setProject] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState('first');
  const [enabled, setEnabled] = useState(false);
  const [menuValue, setMenuValue] = useState('Choose an option');

  return (
    <div style={page}>
      <h1 className="h1">Design system</h1>
      <p className="description">Basic controls adapted from the Swarmia frontend, using the synced design tokens.</p>

      <section style={section}>
        <h2 className="h3">Buttons</h2>
        <div style={row}>
          {buttonVariants.map(variant => <Button key={variant} variant={variant}>{variant}</Button>)}
        </div>
        <div style={row}>
          {buttonSizes.map(size => <Button key={size} variant="primary" size={size}>{size}</Button>)}
          <Button disabled>Disabled</Button>
          <Button loading>Saving</Button>
        </div>
      </section>

      <section style={section}>
        <h2 className="h3">Inputs and selection</h2>
        <div style={row}>
          <label style={label}>Text input<Input value={text} onChange={event => setText(event.target.value)} placeholder="Issue title" /></label>
          <label style={label}>Large input<Input variant="large" placeholder="Large input" /></label>
          <label style={label}>Select<Select value={project} onChange={event => setProject(event.target.value)}><option value="">Choose project</option><option value="a">Project A</option><option value="b">Project B</option></Select></label>
          <div style={label}>Checkbox select<Select mode="checkbox" aria-label="Checkbox select" value={selectedProjects} onValuesChange={setSelectedProjects} placeholder="Choose projects" options={[{ value: 'a', label: 'Project A' }, { value: 'b', label: 'Project B' }, { value: 'c', label: 'Project C', disabled: true }]} /></div>
        </div>
        <div style={{ ...row, alignItems: 'start' }}>
          <label style={{ ...label, flex: 1 }}>Text area<TextArea rows={3} placeholder="Add a note…" /></label>
          <label style={label}>Dropdown<Dropdown header={menuValue} options={[{ key: 'backlog', element: 'Backlog', group: 'Status' }, { key: 'progress', element: 'In progress', group: 'Status' }, { key: 'done', element: 'Done', group: 'Status' }]} onSelect={key => setMenuValue(({ backlog: 'Backlog', progress: 'In progress', done: 'Done' } as Record<string, string>)[key] ?? key)} search={{ placeholder: 'Search statuses' }} /></label>
        </div>
      </section>

      <section style={section}>
        <h2 className="h3">Choices</h2>
        <div style={row}>
          <Checkbox label="Checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />
          <Checkbox label="Disabled" disabled />
          <Radio name="example-radio" label="First" value="first" checked={radio === 'first'} onChange={() => setRadio('first')} />
          <Radio name="example-radio" label="Second" value="second" checked={radio === 'second'} onChange={() => setRadio('second')} />
          <Switch label="Switch" checked={enabled} onCheckedChange={setEnabled} />
          <Switch label="Disabled" disabled />
        </div>
      </section>
    </div>
  );
}
