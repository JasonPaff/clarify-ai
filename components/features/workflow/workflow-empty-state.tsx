'use client';

import type { ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { FileSearch, FolderOpen, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const workflowEmptyStateVariants = cva(
  `
    flex flex-col items-center justify-center py-12 text-center
  `,
  {
    defaultVariants: {
      variant: 'noHistory',
    },
    variants: {
      variant: {
        noContext: '',
        noHistory: '',
        noResults: '',
      },
    },
  }
);

const VARIANT_CONFIG = {
  noContext: {
    description: 'Add context files to help the AI understand your codebase better.',
    icon: FolderOpen,
    title: 'No context files added',
  },
  noHistory: {
    description: 'Run the workflow to see your execution history here.',
    icon: History,
    title: 'No run history yet',
  },
  noResults: {
    description: 'Run the discovery step to find relevant files in your codebase.',
    icon: FileSearch,
    title: 'No discovery results',
  },
} as const;

interface WorkflowEmptyStateProps extends ClassName, VariantProps<typeof workflowEmptyStateVariants> {
  actionLabel?: string;
  customDescription?: string;
  customIcon?: ReactNode;
  customTitle?: string;
  onAction?: () => void;
}

type WorkflowEmptyStateVariant = keyof typeof VARIANT_CONFIG;

export const WorkflowEmptyState = ({
  actionLabel,
  className,
  customDescription,
  customIcon,
  customTitle,
  onAction,
  variant = 'noHistory',
}: WorkflowEmptyStateProps) => {
  const config = VARIANT_CONFIG[variant as WorkflowEmptyStateVariant];
  const Icon = config.icon;

  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;

  const hasAction = onAction && actionLabel;

  return (
    <div className={cn(workflowEmptyStateVariants({ variant }), className)}>
      {/* Icon */}
      <div
        className={`
          mb-4 flex size-12 items-center justify-center rounded-full bg-muted
          text-muted-foreground
        `}
      >
        {customIcon ?? <Icon className={'size-6'} />}
      </div>

      {/* Title */}
      <h3 className={'text-lg font-semibold text-foreground'}>{title}</h3>

      {/* Description */}
      <p className={'mt-1 max-w-sm text-sm text-muted-foreground'}>{description}</p>

      {/* Action Button */}
      {hasAction && (
        <div className={'mt-4'}>
          <Button onClick={onAction} size={'sm'} variant={'outline'}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
