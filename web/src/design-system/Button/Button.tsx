import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '../variants';
import { sx, type Utility } from '../utilities';

const sizeUtilities: Record<ButtonSize, Utility[]> = {
  small: ['h-24', 'px-12', 'leading-16'],
  medium: ['h-32'],
  large: ['h-40'],
  xlarge: ['h-56', 'text-18'],
};

const variantUtilities: Record<ButtonVariant, Utility[]> = {
  primary: ['text-buttonPrimaryText', 'bg-buttonPrimaryBg'],
  secondary: ['text-buttonSecondaryText', 'bg-buttonSecondaryBg'],
  destructive: ['text-buttonDestructiveText', 'bg-buttonDestructiveBg'],
  ghost: ['text-buttonGhostText', 'bg-buttonGhostBg'],
  ghostDestructive: ['text-buttonDestructiveText', 'bg-buttonGhostBg'],
  subtle: ['text-textPrimary', 'bg-strokeLight'],
  link: ['h-auto', 'p-0', 'bg-transparent', 'text-textLinkDefault', 'font-Inter'],
  linkBlack: ['h-auto', 'p-0', 'bg-transparent', 'text-textPrimary', 'font-Inter'],
  linkInline: ['h-auto', 'p-0', 'bg-transparent', 'text-textLinkDefault', 'font-Inter'],
  plain: ['h-auto', 'p-0', 'bg-transparent', 'text-inherit'],
  underlineLink: ['h-auto', 'p-0', 'bg-transparent', 'text-inherit', 'underline'],
  tooltipLink: ['h-auto', 'p-0', 'bg-transparent', 'text-blue300'],
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPlacement?: 'left' | 'right';
  circle?: boolean;
  block?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary', size = 'medium', icon, iconPlacement = 'left',
    circle = false, block = false, loading = false, disabled, children,
    className, style, type = 'button', ...props
  },
  ref,
) {
  const iconOnly = Boolean(icon) && !children;
  const buttonStyle = sx(
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-8',
    'flex-none',
    'border-0',
    'rounded-medium',
    'px-16',
    'font-FactorA',
    'text-14',
    'font-medium',
    'leading-20',
    'whitespace-nowrap',
    'cursor-pointer',
    'transition-colors',
    ...sizeUtilities[size],
    ...variantUtilities[variant],
    iconOnly && 'aspect-square',
    iconOnly && 'p-0',
    circle && 'rounded-round',
    block && 'w-full',
    style,
  );
  return (
    <button ref={ref} type={type} className={className} style={buttonStyle} data-ui={`controls.button controls.button_${variant}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span style={sx('w-16', 'h-16', 'border-current-2', 'border-r-transparent', 'rounded-full', 'animate-spin')} data-ui="controls.spinner" aria-hidden="true" />}
      {!loading && iconPlacement === 'left' && icon && <span style={sx('inline-flex', 'items-center')} data-ui="controls.buttonIcon" aria-hidden="true">{icon}</span>}
      {children}
      {!loading && iconPlacement === 'right' && icon && <span style={sx('inline-flex', 'items-center')} data-ui="controls.buttonIcon" aria-hidden="true">{icon}</span>}
    </button>
  );
});
