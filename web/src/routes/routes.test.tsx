import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ISSUE_DETAIL_QUERY, ISSUE_LIST_QUERY } from '../gql/queries';
import { child, issue } from '../test/fixtures';
import type { IssueFilter } from '../gql/types';
import { IssueDetailPage } from './IssueDetailPage';
import { IssueListPage } from './IssueListPage';

function listMock(filter: IssueFilter = { search: null, projectId: null, statuses: null }, issues = [issue, child]) {
  return {
    request: { query: ISSUE_LIST_QUERY, variables: { filter } },
    result: { data: { projects: [issue.project], issues } },
  };
}

function listPage(mocks: MockedResponse[] = [listMock()]) {
  return render(<MockedProvider mocks={mocks}>
    <MemoryRouter><IssueListPage /></MemoryRouter>
  </MockedProvider>);
}

function detailPage(result: { issue: typeof issue | null } = { issue }) {
  return render(<MockedProvider mocks={[{
    request: { query: ISSUE_DETAIL_QUERY, variables: { issueKey: 'DEMO-1' } },
    result: { data: result },
  }]}>
    <MemoryRouter initialEntries={['/issues/DEMO-1']}>
      <Routes><Route path="/issues/:key" element={<IssueDetailPage />} /></Routes>
    </MemoryRouter>
  </MockedProvider>);
}

describe('IssueListPage', () => {
  it('loads issues and shows stored and derived values', async () => {
    listPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading issues');
    expect(await screen.findByRole('link', { name: /DEMO-1.*Parent issue/ })).toHaveAttribute('href', '/issues/DEMO-1');
    expect(screen.getByText('2 issues')).toBeInTheDocument();
    expect(screen.getAllByText('Ada Lovelace')).toHaveLength(2);
  });

  it('sends combined search, project, and multiple status filters and shows an empty result', async () => {
    const user = userEvent.setup();
    const mocks = [
      listMock(),
      listMock({ search: 'DEMO', projectId: null, statuses: null }),
      listMock({ search: 'DEMO', projectId: 'project-1', statuses: null }),
      listMock({ search: 'DEMO', projectId: 'project-1', statuses: ['DONE'] }),
      listMock({ search: 'DEMO', projectId: 'project-1', statuses: ['DONE', 'IN_PROGRESS'] }, []),
    ];
    listPage(mocks);
    await screen.findByText('2 issues');
    fireEvent.change(screen.getByPlaceholderText('Search key or title…'), { target: { value: 'DEMO' } });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Project' }), 'project-1');
    await user.click(screen.getByRole('button', { name: 'Status' }));
    await user.click(screen.getByRole('checkbox', { name: 'Done' }));
    await user.click(screen.getByRole('checkbox', { name: 'In progress' }));
    expect(await screen.findByText('No issues match these filters.')).toBeInTheDocument();
  });

  it('shows a query error and offers retry', async () => {
    const mock = { request: listMock().request, error: new Error('Network unavailable') };
    listPage([mock]);
    expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('IssueDetailPage', () => {
  it('renders its main sections and opens and closes the note composer', async () => {
    const user = userEvent.setup();
    detailPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading DEMO-1');
    expect(await screen.findByRole('heading', { name: 'Parent issue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Effort/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lifecycle' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Child issues' })).toBeInTheDocument();
    expect(screen.getByText('0 added after start of 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Save note' })).not.toBeInTheDocument();
  });

  it('explains a null scope increase when work never started', async () => {
    detailPage({ issue: { ...issue, scopeIncrease: null, startedAt: null, inProgressTimeSeconds: null } });
    expect(await screen.findByText('never started')).toBeInTheDocument();
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0);
  });

  it('reports a missing issue', async () => {
    detailPage({ issue: null });
    expect(await screen.findByText('No issue found for DEMO-1.')).toBeInTheDocument();
  });
});
