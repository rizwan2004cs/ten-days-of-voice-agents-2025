'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full',
    'text-sm font-medium whitespace-nowrap',
    'cursor-pointer outline-none transition-[color,box-shadow,background-color]',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive ',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:text-current",
  ],
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:bg-muted hover:text-muted-foreground',
        primary:
          'border-2 border-[#00ff41] bg-[#0a0a0a] text-[#00ff41] data-[state=on]:bg-[#ff0040] data-[state=on]:text-[#050505] data-[state=on]:border-[#ff0040] hover:bg-[#00ff41]/20 hover:text-[#00ff41] hover:data-[state=on]:bg-[#ff0040] hover:data-[state=on]:text-[#050505] data-[state=off]:bg-[#0a0a0a] data-[state=off]:text-[#003b00] data-[state=on]:animate-pulse',
        secondary:
          'terminal-border bg-[#0a0a0a] text-terminal-green data-[state=on]:bg-terminal-green data-[state=on]:text-[#050505] hover:bg-terminal-green/20 hover:text-terminal-green hover:data-[state=on]:bg-terminal-green hover:data-[state=on]:text-[#050505] data-[state=off]:bg-[#0a0a0a] data-[state=off]:text-terminal-dim',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
