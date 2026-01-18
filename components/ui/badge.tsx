'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  `
    inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium
    whitespace-nowrap transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
  `,
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        sm: 'px-2 py-0.5 text-xs',
      },
      variant: {
        anthropic: `
          bg-orange-500/15 text-orange-700
          dark:bg-orange-500/20 dark:text-orange-400
        `,
        completed: `
          bg-green-500/15 text-green-700
          dark:bg-green-500/20 dark:text-green-400
        `,
        default: `
          bg-muted text-muted-foreground
        `,
        draft: `
          bg-neutral-500/15 text-neutral-700
          dark:bg-neutral-500/20 dark:text-neutral-400
        `,
        environment: `
          bg-cyan-500/15 text-cyan-700
          dark:bg-cyan-500/20 dark:text-cyan-400
        `,
        google: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        openai: `
          bg-emerald-500/15 text-emerald-700
          dark:bg-emerald-500/20 dark:text-emerald-400
        `,
        planning: `
          bg-purple-500/15 text-purple-700
          dark:bg-purple-500/20 dark:text-purple-400
        `,
        refining: `
          bg-yellow-500/15 text-yellow-700
          dark:bg-yellow-500/20 dark:text-yellow-400
        `,
        researching: `
          bg-blue-500/15 text-blue-700
          dark:bg-blue-500/20 dark:text-blue-400
        `,
        user: `
          bg-violet-500/15 text-violet-700
          dark:bg-violet-500/20 dark:text-violet-400
        `,
      },
    },
  }
);

type BadgeProps = ComponentPropsWithRef<'span'> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, ref, size, variant, ...props }: BadgeProps) => {
  return <span className={cn(badgeVariants({ className, size, variant }))} ref={ref} {...props} />;
};
