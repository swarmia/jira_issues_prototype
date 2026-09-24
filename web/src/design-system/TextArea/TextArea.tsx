import { forwardRef, type KeyboardEvent, type TextareaHTMLAttributes } from 'react';
import { sx } from '../utilities';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  onSubmit?: () => void;
  submitOnEnter?: boolean;
  bordered?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { onSubmit, submitOnEnter = false, bordered = true, resize = 'vertical', className, onKeyDown, style, ...props },
  ref,
) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Enter' || !onSubmit) return;
    if ((submitOnEnter && !event.shiftKey) || (!submitOnEnter && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      onSubmit();
    }
  }
  return <textarea ref={ref} className={className} style={sx(
    'text-buttonSecondaryText',
    'bg-mainBackground',
    'border-strokeDark',
    'rounded-medium',
    'shadow-small',
    'font-inherit',
    'block',
    'w-full',
    'min-h-textarea',
    'py-8-px-12',
    !bordered && 'border-0',
    !bordered && 'shadow-none',
    !bordered && 'bg-transparent',
    { resize },
    style,
  )} data-ui="controls.textArea" onKeyDown={handleKeyDown} {...props} />;
});
