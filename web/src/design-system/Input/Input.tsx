import { forwardRef, type CSSProperties, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { sx } from '../utilities';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  prefix?: ReactNode;
  suffix?: ReactNode;
  variant?: 'medium' | 'large';
  onSubmit?: () => void;
  onEnter?: () => void;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    icon, iconPosition = 'right', prefix, suffix, variant = 'medium',
    onSubmit, onEnter, wrapperClassName, wrapperStyle, className,
    onKeyDown, disabled, readOnly, style, ...props
  },
  ref,
) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Enter') return;
    if ((event.metaKey || event.ctrlKey) && onSubmit) {
      event.preventDefault();
      onSubmit();
    } else if (onEnter) {
      event.preventDefault();
      onEnter();
    }
  }

  return (
    <span className={wrapperClassName} style={sx(
      'text-buttonSecondaryText',
      'bg-mainBackground',
      'border-strokeDark',
      'rounded-medium',
      'shadow-small',
      'font-inherit',
      'inline-flex',
      'items-center',
      'gap-4',
      'min-w-0',
      'h-32',
      'px-12',
      variant === 'large' && 'h-55',
      variant === 'large' && 'shadow-inputLarge',
      wrapperStyle,
    )} data-ui="controls.field">
      {iconPosition === 'left' && icon && <span style={sx('inline-flex', 'flex-none', 'w-24', 'items-center', 'justify-center')} data-ui="controls.fieldIcon" aria-hidden="true">{icon}</span>}
      {prefix && <span style={sx('flex-none')} data-ui="controls.fieldAddon">{prefix}</span>}
      <input ref={ref} className={className} style={sx(
        'w-full',
        'min-w-0',
        'h-full',
        'p-0',
        'border-0',
        'outline-0',
        'bg-transparent',
        'text-inherit',
        'font-inherit',
        style,
      )} data-ui="controls.fieldControl" disabled={disabled} readOnly={readOnly} onKeyDown={handleKeyDown} {...props} />
      {suffix && <span style={sx('flex-none')} data-ui="controls.fieldAddon">{suffix}</span>}
      {iconPosition === 'right' && icon && <span style={sx('inline-flex', 'flex-none', 'w-24', 'items-center', 'justify-center')} data-ui="controls.fieldIcon" aria-hidden="true">{icon}</span>}
    </span>
  );
});
