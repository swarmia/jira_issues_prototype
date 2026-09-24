import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import type { ButtonVariant } from '../variants';
import { sx } from '../utilities';

export type DropdownItem = {
  key: string;
  element: ReactNode;
  searchText?: string;
  group?: string;
  isDisabled?: boolean;
};

export type DropdownProps = {
  header: ReactNode;
  options: DropdownItem[];
  onSelect: (key: string) => void;
  listHeading?: ReactNode;
  disabled?: boolean;
  width?: 120 | 240 | 400;
  fullWidth?: boolean;
  search?: { placeholder: string; onSearch?: (query: string) => void };
  buttonVariant?: ButtonVariant;
  className?: string;
};

export function Dropdown({
  header, options, onSelect, listHeading, disabled = false, width = 240,
  fullWidth = false, search, buttonVariant = 'secondary', className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const visible = options.filter(option => !query || (option.searchText ?? (typeof option.element === 'string' ? option.element : '')).toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(visible.map(option => option.group))];
  const ordered = groups.flatMap(group => visible.filter(option => option.group === group));

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
        search?.onSearch?.('');
      }
    }
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [open, search]);

  useEffect(() => {
    if (open && search) searchRef.current?.focus();
  }, [open, search]);

  function close() {
    setOpen(false);
    setQuery('');
    search?.onSearch?.('');
    triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div ref={rootRef} className={className} style={sx('relative', 'inline-block', fullWidth && 'w-full')} data-ui="controls.dropdown">
      <Button ref={triggerRef} variant={buttonVariant} disabled={disabled} block={fullWidth} aria-expanded={open} aria-haspopup="menu" aria-controls={open ? menuId : undefined} onClick={() => { if (open) close(); else setOpen(true); }}>
        {header}<span style={sx('w-7', 'h-7', 'border-r-current-semi', 'border-b-current-semi', 'rotate-caret')} data-ui="controls.caret" aria-hidden="true" />
      </Button>
      {open && (
        <div id={menuId} style={sx(
          'absolute',
          'z-menu',
          'top-menu',
          'left-0',
          'max-w-menu',
          'p-8',
          'border-strokeLight',
          'rounded-large',
          'bg-mainBackground',
          'shadow-medium',
          { minWidth: width },
        )} data-ui="controls.menu" role="menu" onKeyDown={handleMenuKeyDown}>
          {listHeading && <div style={sx('p-8')} data-ui="controls.menuHeading">{listHeading}</div>}
          {search && <Input ref={searchRef} type="search" value={query} placeholder={search.placeholder} aria-label={search.placeholder} onChange={event => { setQuery(event.target.value); search.onSearch?.(event.target.value); }} wrapperStyle={sx('flex', 'w-full', 'mb-8')} />}
          <div style={sx('max-h-menu', 'overflow-y-auto')} data-ui="controls.menuOptions">
            {ordered.map((option, index) => (
              <div key={option.key}>
                {option.group && (index === 0 || option.group !== ordered[index - 1]?.group) && <div style={sx(
                  'p-8',
                  'text-textSecondary',
                  'font-FactorA',
                  'text-13',
                  'font-medium',
                  'uppercase',
                  'tracking-6',
                )} data-ui="controls.menuGroup">{option.group}</div>}
                <button type="button" role="menuitem" style={sx(
                  'block',
                  'w-full',
                  'min-h-menu-item',
                  'p-8',
                  'border-0',
                  'rounded-medium',
                  'bg-transparent',
                  'text-textPrimary',
                  'font-inherit',
                  'text-left',
                  'cursor-pointer',
                )} data-ui="controls.menuItem" disabled={option.isDisabled} onClick={() => { onSelect(option.key); close(); }}>{option.element}</button>
              </div>
            ))}
            {ordered.length === 0 && <div style={sx('p-8', 'text-textSecondary')} data-ui="controls.menuEmpty">No options</div>}
          </div>
        </div>
      )}
    </div>
  );
}
