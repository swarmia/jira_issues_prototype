import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ADD_ANNOTATION_MUTATION, DELETE_ANNOTATION_MUTATION } from '../gql/queries';
import { author, child, issue } from '../test/fixtures';
import { AnnotationsPanel } from './AnnotationsPanel';
import { ChildIssues } from './ChildIssues';
import { Description } from './Description';
import { EffortCard } from './EffortCard';
import { LifecycleTimeline } from './LifecycleTimeline';
import { ProgressCard } from './ProgressCard';
import { Sidebar } from './Sidebar';
import { StatusBadge } from './StatusBadge';
import { BurnupChart } from './charts/BurnupChart';

describe('issue components', () => {
  it('renders the source status and identifies an unmapped status', () => {
    render(<StatusBadge sourceStatus="Waiting for QA" status={null} />);
    expect(screen.getByText('Waiting for QA')).toHaveAttribute('title', 'This status is not mapped to a Swarmia status');
  });

  it('expands rich text and handles a missing description', async () => {
    const user = userEvent.setup();
    const { rerender, container } = render(<Description description={issue.description} />);
    expect(screen.getByText('important', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText('npm test', { selector: 'code' })).toBeInTheDocument();
    expect(container.querySelector('[data-ui="Description.body"]')).toHaveStyle({ maxHeight: '60px' });
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(container.querySelector('[data-ui="Description.body"]')).toHaveStyle({ maxHeight: 'none' });
    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(container.querySelector('[data-ui="Description.body"]')).toHaveStyle({ maxHeight: '60px' });
    rerender(<Description description={null} />);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('counts descendants without including the parent', () => {
    const { container } = render(<MemoryRouter><ChildIssues issues={[child]} counts={issue.descendantStatusCounts} selfStatus="IN_PROGRESS" /></MemoryRouter>);
    const counts = container.querySelector('[data-ui="ChildIssues.counts"]')!;
    expect(within(counts as HTMLElement).getByTitle('Done')).toHaveTextContent('1');
    expect(within(counts as HTMLElement).queryByTitle('In progress')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DEMO-2.*Child task/ })).toHaveAttribute('href', '/issues/DEMO-2');
  });

  it('shows progress metrics, including the distinction between null and zero time', () => {
    const { rerender } = render(<ProgressCard issue={{ ...issue, inProgressTimeSeconds: null }} />);
    expect(screen.getAllByText('50%')).toHaveLength(2);
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 days')).toBeInTheDocument();
    rerender(<ProgressCard issue={{ ...issue, inProgressTimeSeconds: 0 }} />);
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });

  it('switches effort between monthly totals and contributors', async () => {
    const user = userEvent.setup();
    render(<EffortCard effort={issue.effort} />);
    expect(screen.getByTitle(/Jan: 0.5 FTE months/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Contributors' }));
    expect(screen.getByRole('tab', { name: 'Contributors' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(author.name)).toBeInTheDocument();
    expect(screen.queryByTitle(/Jan: 0.5 FTE months/)).not.toBeInTheDocument();
  });

  it('combines adjacent mapped periods but preserves an unmapped gap', () => {
    const periods = [
      { ...issue.statusPeriods[0]!, id: 'a', period: { start: '2026-01-01T00:00:00Z', end: '2026-01-02T00:00:00Z' }, durationInSeconds: 86400 },
      { ...issue.statusPeriods[0]!, id: 'b', period: { start: '2026-01-02T00:00:00Z', end: '2026-01-03T00:00:00Z' }, durationInSeconds: 86400 },
      { ...issue.statusPeriods[0]!, id: 'c', status: null, sourceStatus: 'Waiting for QA', period: { start: '2026-01-03T00:00:00Z', end: null }, durationInSeconds: 86400 },
    ];
    const { container } = render(<LifecycleTimeline statusPeriods={periods} createdAt={issue.createdAt} />);
    expect(container.querySelectorAll('[data-ui="LifecycleTimeline.timeline"] [aria-label]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-ui="LifecycleTimeline.timeline"] [aria-hidden="true"]')).toHaveLength(1);
    fireEvent.mouseEnter(screen.getByLabelText(/In progress/));
    expect(screen.getByText(/In progress · 2 days/)).toBeInTheDocument();
  });

  it('shows burnup point values on hover', () => {
    const { container } = render(<BurnupChart points={issue.progress.burnup} from={issue.createdAt} to="2026-01-04T00:00:00Z" startedAt={issue.startedAt} />);
    const svg = screen.getByRole('img', { name: 'Burn-up of scope and completed work' });
    Object.defineProperty(svg, 'getBoundingClientRect', { value: () => ({ left: 0, width: 720 }) });
    fireEvent.mouseMove(svg, { clientX: 40 });
    expect(screen.getByText('1 of 2 done')).toBeInTheDocument();
    expect(container.querySelector('[data-ui="BurnupChart.tooltip"]')).toBeInTheDocument();
    fireEvent.mouseLeave(svg);
    expect(screen.queryByText('1 of 2 done')).not.toBeInTheDocument();
  });

  it('links the available sidebar destinations', () => {
    render(<MemoryRouter initialEntries={['/issues']}><Sidebar /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Focus/ })).toHaveAttribute('href', '/issues');
    expect(screen.getByRole('link', { name: /Design system/ })).toHaveAttribute('href', '/design-system');
    expect(screen.getByText('Home').closest('[aria-disabled="true"]')).toBeInTheDocument();
  });
});

describe('AnnotationsPanel', () => {
  it('saves a trimmed note and closes the composer', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const mock = {
      request: { query: ADD_ANNOTATION_MUTATION, variables: { issueKey: issue.issueKey, content: 'A new note' } },
      result: { data: { addAnnotation: { issue: { id: issue.id, annotations: issue.annotations } } } },
    };
    render(<MockedProvider mocks={[mock]}><AnnotationsPanel issueKey={issue.issueKey} annotations={[]} composerOpen onCloseComposer={close} /></MockedProvider>);
    const save = screen.getByRole('button', { name: 'Save note' });
    expect(save).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/Add context/), 'A new note');
    await user.click(save);
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it('deletes an existing note and can cancel a draft', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    const mock = {
      request: { query: DELETE_ANNOTATION_MUTATION, variables: { issueKey: issue.issueKey, annotationId: 'note-1' } },
      result: { data: { deleteAnnotation: { id: issue.id, annotations: [] } } },
    };
    render(<MockedProvider mocks={[mock]}><AnnotationsPanel issueKey={issue.issueKey} annotations={issue.annotations} composerOpen onCloseComposer={close} /></MockedProvider>);
    expect(screen.getByText('A decision')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.type(screen.getByPlaceholderText(/Add context/), 'Draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByPlaceholderText(/Add context/)).toHaveValue('');
  });
});
