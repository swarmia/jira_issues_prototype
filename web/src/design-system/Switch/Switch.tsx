import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { sx } from '../utilities';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, onCheckedChange, onChange, className, ...props }, ref,
) {
  return (
    <label className={className} style={sx(
      'inline-flex',
      'items-center',
      'gap-12',
      'text-buttonSecondaryText',
      'font-medium',
      'cursor-pointer',
    )} data-ui="controls.switchLabel">
      <input
        ref={ref} type="checkbox" role="switch" style={sx('absolute', 'w-1', 'h-1', 'opacity-0')} data-ui="controls.switchInput"
        onChange={event => { onChange?.(event); onCheckedChange?.(event.target.checked); }}
        {...props}
      />
      <span style={sx(
        'relative',
        'flex-none',
        'w-36',
        'h-20',
        'rounded-round',
        'bg-strokeDark',
        'transition-colors',
      )} data-ui="controls.switchTrack" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
});
