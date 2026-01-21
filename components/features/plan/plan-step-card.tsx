'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileMinus,
  FilePen,
  FilePlus,
  Pencil,
  Terminal,
} from 'lucide-react';

import type { PlanFile, PlanStep, QualityGate } from '@/lib/validations/plan';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/**
 * CVA variants for complexity badge colors
 */
export const complexityBadgeVariants = cva(
  `
    inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
  `,
  {
    defaultVariants: {
      complexity: 'medium',
    },
    variants: {
      complexity: {
        high: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        low: 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        medium: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      },
    },
  }
);

/**
 * Maps file action types to their corresponding icons
 */
const FILE_ACTION_ICONS: Record<NonNullable<PlanFile['action']>, typeof FilePlus> = {
  create: FilePlus,
  delete: FileMinus,
  modify: FilePen,
  review: Eye,
};

/**
 * Maps file action types to their icon color classes
 */
const FILE_ACTION_COLORS: Record<NonNullable<PlanFile['action']>, string> = {
  create: 'text-green-600 dark:text-green-400',
  delete: 'text-red-600 dark:text-red-400',
  modify: 'text-blue-600 dark:text-blue-400',
  review: 'text-muted-foreground',
};

type PlanStepCardProps = ComponentPropsWithRef<'div'> &
  VariantProps<typeof complexityBadgeVariants> & {
    /** Optional callback when edit button is clicked */
    onEdit?: () => void;
    /** The plan step data to display */
    step: PlanStep;
    /** The step number (1-indexed) */
    stepNumber: number;
  };

/**
 * Displays an individual implementation plan step with files, complexity, and quality gates.
 * Includes collapsible section for detailed content when step has many items.
 */
export const PlanStepCard = ({ className, onEdit, ref, step, stepNumber, ...props }: PlanStepCardProps) => {
  const { complexity, description, files, qualityGates, title } = step;

  // Derived conditions
  const hasFiles = files && files.length > 0;
  const hasQualityGates = qualityGates && qualityGates.length > 0;
  const hasExpandableContent = hasFiles || hasQualityGates;
  const isLongDescription = description.length > 200;

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-background p-4',
        'transition-colors hover:bg-muted/30',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-0',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header Section */}
      <div className={'flex items-start justify-between gap-3'}>
        {/* Step Number and Title */}
        <div className={'flex min-w-0 flex-1 items-start gap-3'}>
          {/* Step Number Badge */}
          <Badge className={'shrink-0 tabular-nums'} size={'sm'} variant={'default'}>
            {stepNumber}
          </Badge>

          {/* Title */}
          <div className={'min-w-0 flex-1'}>
            <h4 className={'font-medium text-foreground'}>{title}</h4>
          </div>
        </div>

        {/* Complexity Badge and Edit Button */}
        <div className={'flex shrink-0 items-center gap-2'}>
          <span className={cn(complexityBadgeVariants({ complexity }))}>
            {complexity === 'high' && <AlertTriangle aria-hidden={'true'} className={'mr-1 size-3'} />}
            {complexity}
          </span>

          {onEdit && (
            <button
              aria-label={'Edit step'}
              className={cn(
                'rounded-sm p-1 text-muted-foreground',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
              )}
              onClick={onEdit}
              type={'button'}
            >
              <Pencil aria-hidden={'true'} className={'size-4'} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className={'mt-3'}>
        {isLongDescription ? (
          <Collapsible>
            <p className={'line-clamp-3 text-sm text-muted-foreground group-data-panel-open:hidden'}>{description}</p>
            <CollapsibleContent>
              <p className={'max-w-none text-sm/relaxed text-muted-foreground'}>{description}</p>
            </CollapsibleContent>
            <CollapsibleTrigger
              className={'mt-1 gap-1 px-0 text-xs text-accent hover:text-accent-foreground'}
              isHideChevron={true}
              variant={'ghost'}
            >
              <span className={'group-data-panel-open:hidden'}>Show more</span>
              <span className={'hidden group-data-panel-open:inline'}>Show less</span>
              <ChevronDown
                aria-hidden={'true'}
                className={'size-3 transition-transform group-data-panel-open:rotate-180'}
              />
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <p className={'max-w-none text-sm/relaxed text-muted-foreground'}>{description}</p>
        )}
      </div>

      {/* Expandable Details */}
      {hasExpandableContent && (
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger
            className={'mt-3 px-0 text-xs text-accent hover:text-accent-foreground'}
            variant={'ghost'}
          >
            View Details
          </CollapsibleTrigger>

          <CollapsibleContent className={'mt-3'}>
            <div className={'space-y-4 border-t border-border pt-3'}>
              {/* Files Section */}
              {hasFiles && (
                <div>
                  <span className={'text-xs font-medium text-foreground'}>Affected Files ({files.length})</span>
                  <ul className={'mt-2 space-y-1'}>
                    {files.map((file) => (
                      <FileItem file={file} key={file.path} />
                    ))}
                  </ul>
                </div>
              )}

              {/* Quality Gates Section */}
              {hasQualityGates && (
                <div>
                  <span className={'text-xs font-medium text-foreground'}>Quality Gates ({qualityGates.length})</span>
                  <ul className={'mt-2 space-y-2'}>
                    {qualityGates.map((gate, index) => (
                      <QualityGateItem gate={gate} key={`${gate.type}-${index}`} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

/**
 * File item component for displaying affected files
 */
interface FileItemProps {
  file: PlanFile;
}

const FileItem = ({ file }: FileItemProps) => {
  const { action = 'modify', path, reason } = file;

  const ActionIcon = FILE_ACTION_ICONS[action];
  const actionColorClass = FILE_ACTION_COLORS[action];

  // Extract filename from path
  const fileName = path.split('/').pop() ?? path;
  const directoryPath = path.slice(0, path.lastIndexOf('/')) || '.';

  return (
    <li className={'flex items-start gap-2 rounded-md p-1.5 hover:bg-muted/50'}>
      <ActionIcon aria-hidden={'true'} className={cn('mt-0.5 size-4 shrink-0', actionColorClass)} />
      <div className={'min-w-0 flex-1'}>
        <div className={'flex flex-wrap items-center gap-1.5'}>
          <span className={'truncate text-sm font-medium text-foreground'}>{fileName}</span>
          <Badge size={'sm'} variant={action === 'create' ? 'completed' : action === 'delete' ? 'failed' : 'default'}>
            {action}
          </Badge>
        </div>
        <span className={'text-xs text-muted-foreground'}>{directoryPath}</span>
        {reason && <p className={'mt-0.5 text-xs text-muted-foreground'}>{reason}</p>}
      </div>
    </li>
  );
};

/**
 * Quality gate item component for displaying validation checkpoints
 */
interface QualityGateItemProps {
  gate: QualityGate;
}

const QualityGateItem = ({ gate }: QualityGateItemProps) => {
  const { command, description, type } = gate;
  const isCommand = type === 'command';

  return (
    <li className={'flex items-start gap-2'}>
      {/* Checkbox (non-interactive, just visual) */}
      <Checkbox className={'mt-0.5'} disabled={true} size={'sm'} />

      <div className={'min-w-0 flex-1'}>
        {/* Type Indicator and Description */}
        <div className={'flex items-start gap-2'}>
          {isCommand ? (
            <Terminal aria-hidden={'true'} className={'mt-0.5 size-3.5 shrink-0 text-blue-600 dark:text-blue-400'} />
          ) : (
            <CheckCircle2
              aria-hidden={'true'}
              className={'mt-0.5 size-3.5 shrink-0 text-muted-foreground'}
            />
          )}
          <span className={'text-sm text-foreground'}>{description}</span>
        </div>

        {/* Command (if applicable) */}
        {isCommand && command && (
          <code className={'mt-1 block rounded-sm bg-muted px-2 py-1 font-mono text-xs text-muted-foreground'}>
            {command}
          </code>
        )}

        {/* Type Badge */}
        <div className={'mt-1'}>
          <Badge size={'sm'} variant={isCommand ? 'researching' : 'default'}>
            {isCommand ? 'Automated' : 'Manual'}
          </Badge>
        </div>
      </div>
    </li>
  );
};
