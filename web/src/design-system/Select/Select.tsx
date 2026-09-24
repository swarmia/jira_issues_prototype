import { forwardRef, useId, useRef, useState, type CSSProperties, type SelectHTMLAttributes } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { Popover } from '../Popover/Popover';
import { sx } from '../utilities';

type BaseProps = { variant?: 'small' | 'large'; block?: boolean };
type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & BaseProps & { mode?: 'native' };
type CheckboxSelectProps = BaseProps & {
  mode: 'checkbox';
  options: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label': string;
};

export type SelectProps = NativeSelectProps | CheckboxSelectProps;

/**
 * A design-system selection control. Native mode keeps the browser's single-choice
 * select and its normal change event. Checkbox mode receives controlled string values,
 * shows a checkbox popover, and reports the next value array without closing it so
 * several options can be changed in one visit. The forwarded ref applies to native
 * mode only; checkbox mode owns a button as its trigger.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  if (props.mode === 'checkbox') {
    const { options, value, onValuesChange, placeholder = 'Select options', disabled = false,
      variant = 'small', block = false, className, style } = props;
    const selected = options.filter(option => value.includes(option.value)).map(option => option.label);

    function toggle(optionValue: string) {
      onValuesChange(value.includes(optionValue)
        ? value.filter(item => item !== optionValue)
        : [...value, optionValue]);
    }

    return (
      <Popover triggerRef={triggerRef} open={open && !disabled} onClose={() => setOpen(false)}
        id={panelId} label={props['aria-label']} block={block} trigger={(
        <button ref={triggerRef} type="button" className={className} disabled={disabled}
          aria-label={props['aria-label']} aria-haspopup="true" aria-expanded={open && !disabled}
          aria-controls={open && !disabled ? panelId : undefined}
          onClick={() => setOpen(current => !current)}
          style={sx(
            'inline-flex', 'items-center', 'border-strokeDark', 'rounded-medium', 'shadow-small',
            'bg-mainBackground', 'text-buttonSecondaryText', 'font-inherit', 'h-32',
            'min-w-select', 'px-12', 'cursor-pointer',
            variant === 'large' && 'h-55', block && 'w-full',
            { justifyContent: 'space-between', gap: 'var(--space12)', textAlign: 'left' }, style,
          )} data-ui="controls.select controls.checkboxSelect">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.length ? selected.join(', ') : placeholder}
          </span>
          <span style={sx('w-7', 'h-7', 'border-r-current-semi', 'border-b-current-semi', 'rotate-caret', 'flex-none')} aria-hidden="true" />
        </button>
      )}>
        <div style={sx('max-h-menu', 'overflow-y-auto')}>
          {options.map(option => (
            <Checkbox key={option.value} label={option.label} checked={value.includes(option.value)}
              disabled={option.disabled} onChange={() => toggle(option.value)}
              className="checkboxSelectOption" />
          ))}
          {options.length === 0 && <div style={sx('p-8', 'text-textSecondary')}>No options</div>}
        </div>
      </Popover>
    );
  }

  const { variant = 'small', block = false, className, style, children, mode: _mode, ...nativeProps } = props;
  return (
    <select ref={ref} className={className} style={sx(
      'text-buttonSecondaryText',
      'bg-mainBackground',
      'border-strokeDark',
      'rounded-medium',
      'shadow-small',
      'font-inherit',
      'h-32',
      'min-w-select',
      'px-12',
      'cursor-pointer',
      variant === 'large' && 'h-55',
      block && 'w-full',
      style,
    )} data-ui="controls.select" {...nativeProps}>
      {children}
    </select>
  );
});
