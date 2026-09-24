export const buttonVariants = [
  'primary', 'secondary', 'destructive', 'ghost', 'ghostDestructive',
  'link', 'linkBlack', 'linkInline', 'plain', 'subtle', 'underlineLink', 'tooltipLink',
] as const;

export const buttonSizes = ['small', 'medium', 'large', 'xlarge'] as const;

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = (typeof buttonSizes)[number];
