import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { sx } from '../utilities';

export type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode };

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox(
  { label, className, ...props }, ref,
) {
  return (
    <label className={className} style={sx(
      'inline-flex',
      'items-center',
      'gap-8',
      'text-buttonSecondaryText',
      'font-medium',
      'cursor-pointer',
    )} data-ui="controls.choice">
      <input ref={ref} type="checkbox" style={sx('w-16', 'h-16', 'm-0', 'accent-blue500', 'cursor-inherit', 'rounded-small')} data-ui="controls.checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
});
