import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { sx } from '../utilities';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode };

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
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
      <input ref={ref} type="radio" style={sx('w-16', 'h-16', 'm-0', 'accent-blue500', 'cursor-inherit')} data-ui="controls.radio" {...props} />
      <span>{label}</span>
    </label>
  );
});
