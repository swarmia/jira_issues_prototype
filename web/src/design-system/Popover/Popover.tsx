import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { sx } from '../utilities';

/**
 * Anchors a small interactive panel to its trigger. The parent owns its open state;
 * this boundary closes on outside pointer input or Escape and returns keyboard focus
 * to the trigger after Escape. Content stays mounted only while open, so controls in
 * it must keep their selected values in the parent.
 */
export function Popover({
  trigger, triggerRef, open, onClose, children, id, label, block = false,
}: {
  trigger: ReactNode;
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  id: string;
  label: string;
  block?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, triggerRef]);

  return (
    <div ref={rootRef} style={sx('relative', 'inline-block', block && 'w-full')} data-ui="controls.popover">
      {trigger}
      {open && (
        <div id={id} role="group" aria-label={label} style={sx(
          'absolute', 'z-menu', 'top-menu', 'left-0', 'max-w-menu', 'p-8',
          'border-strokeLight', 'rounded-large', 'bg-mainBackground', 'shadow-medium',
          { minWidth: '100%', boxSizing: 'border-box' },
        )} data-ui="controls.popoverPanel">
          {children}
        </div>
      )}
    </div>
  );
}
