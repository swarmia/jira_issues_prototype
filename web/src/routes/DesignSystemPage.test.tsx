import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { DesignSystemPage } from './DesignSystemPage';

it('renders and operates the design system controls', async () => {
  const user = userEvent.setup();
  render(<DesignSystemPage />);

  expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
  await user.type(screen.getByPlaceholderText('Issue title'), 'A title');
  expect(screen.getByPlaceholderText('Issue title')).toHaveValue('A title');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Select' }), 'b');
  expect(screen.getByRole('combobox', { name: 'Select' })).toHaveValue('b');
  const checkboxSelect = screen.getByRole('button', { name: 'Checkbox select' });
  await user.click(checkboxSelect);
  await user.click(screen.getByRole('checkbox', { name: 'Project A' }));
  await user.click(screen.getByRole('checkbox', { name: 'Project B' }));
  expect(screen.getByRole('checkbox', { name: 'Project A' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Project B' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Project C' })).toBeDisabled();
  expect(checkboxSelect).toHaveTextContent('Project A, Project B');
  await user.keyboard('{Escape}');
  expect(checkboxSelect).toHaveAttribute('aria-expanded', 'false');
  expect(checkboxSelect).toHaveFocus();
  await user.click(checkboxSelect);
  await user.click(screen.getByRole('checkbox', { name: 'Project A' }));
  expect(checkboxSelect).toHaveTextContent('Project B');
  await user.click(screen.getByRole('heading', { name: 'Inputs and selection' }));
  expect(checkboxSelect).toHaveAttribute('aria-expanded', 'false');
  await user.type(screen.getByPlaceholderText('Add a note…'), 'A note');
  expect(screen.getByPlaceholderText('Add a note…')).toHaveValue('A note');

  await user.click(screen.getByRole('checkbox', { name: 'Checkbox' }));
  expect(screen.getByRole('checkbox', { name: 'Checkbox' })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'Second' }));
  expect(screen.getByRole('radio', { name: 'Second' })).toBeChecked();
  await user.click(screen.getByRole('switch', { name: 'Switch' }));
  expect(screen.getByRole('switch', { name: 'Switch' })).toBeChecked();

  await user.click(screen.getByRole('button', { name: 'Dropdown' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search statuses' }), 'done');
  expect(screen.getByRole('menuitem', { name: 'Done' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Backlog' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('menuitem', { name: 'Done' }));
  expect(screen.getByRole('button', { name: 'Dropdown' })).toHaveTextContent('Done');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
