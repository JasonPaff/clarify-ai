'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertTriangle, Eye, FileMinus, FilePen, FilePlus, Pencil } from 'lucide-react';

import type { DiscoveredFileEntry, DiscoveryFileAction, DiscoveryRiskLevel } from '@/lib/validations/discovery';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type FileCardProps = ComponentPropsWithRef<'div'> & {
  /** The discovered file entry to display */
  discoveredFile: DiscoveredFileEntry;
};

/**
 * Maps file action types to their corresponding icons
 */
const ACTION_ICONS: Record<DiscoveryFileAction, typeof FilePlus> = {
  create: FilePlus,
  delete: FileMinus,
  modify: FilePen,
  review: Eye,
};

/**
 * Maps file action types to their badge variants
 */
const ACTION_BADGE_VARIANTS: Record<DiscoveryFileAction, 'completed' | 'default' | 'failed' | 'researching'> = {
  create: 'completed',
  delete: 'failed',
  modify: 'researching',
  review: 'default',
};

/**
 * Maps risk levels to their badge classes
 */
const RISK_LEVEL_CLASSES: Record<DiscoveryRiskLevel, string> = {
  high: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  low: 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
};

/**
 * Displays a discovered file with its action, risk level, and summary information.
 * Includes expandable details for dependencies and code snippets.
 */
export const FileCard = ({ className, discoveredFile, ref, ...props }: FileCardProps) => {
  const { action, dependencies, isEdited, path, reason, risk, snippets } = discoveredFile;

  const ActionIcon = ACTION_ICONS[action];
  const actionBadgeVariant = ACTION_BADGE_VARIANTS[action];
  const riskClasses = RISK_LEVEL_CLASSES[risk];

  // Derived conditions
  const hasDependencies = dependencies && dependencies.length > 0;
  const hasSnippets = snippets && snippets.length > 0;
  const hasExpandableContent = hasDependencies || hasSnippets;

  // Extract filename from path
  const fileName = path.split('/').pop() ?? path;
  const directoryPath = path.slice(0, path.lastIndexOf('/')) || '.';

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-background p-3',
        'transition-colors hover:bg-muted/30',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-0',
        className
      )}
      ref={ref}
      {...props}
    >
      <Collapsible>
        {/* Header Section */}
        <div className={'flex items-start justify-between gap-3'}>
          {/* File Info */}
          <div className={'flex min-w-0 flex-1 items-start gap-2'}>
            <ActionIcon
              aria-hidden={'true'}
              className={cn(
                'mt-0.5 size-4 shrink-0',
                action === 'create' && 'text-green-600 dark:text-green-400',
                action === 'delete' && 'text-red-600 dark:text-red-400',
                action === 'modify' && 'text-blue-600 dark:text-blue-400',
                action === 'review' && 'text-muted-foreground'
              )}
            />
            <div className={'min-w-0 flex-1'}>
              {/* File Name */}
              <div className={'flex flex-wrap items-center gap-1.5'}>
                <span className={'truncate font-medium text-foreground'}>{fileName}</span>
                {isEdited && (
                  <Badge className={'gap-1'} size={'sm'} variant={'clarifying'}>
                    <Pencil aria-hidden={'true'} className={'size-3'} />
                    Edited
                  </Badge>
                )}
              </div>
              {/* Directory Path */}
              <span className={'text-xs text-muted-foreground'}>{directoryPath}</span>
            </div>
          </div>

          {/* Badges */}
          <div className={'flex shrink-0 items-center gap-2'}>
            <Badge size={'sm'} variant={actionBadgeVariant}>
              {action}
            </Badge>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', riskClasses)}>
              {risk === 'high' && <AlertTriangle aria-hidden={'true'} className={'mr-1 size-3'} />}
              {risk}
            </span>
          </div>
        </div>

        {/* Reason Text */}
        <p className={'mt-2 line-clamp-2 text-sm text-muted-foreground'}>{reason}</p>

        {/* Expand/Collapse Trigger */}
        {hasExpandableContent && (
          <CollapsibleTrigger
            className={'mt-2 px-0 text-xs text-accent hover:text-accent-foreground'}
            variant={'ghost'}
          >
            View Details
          </CollapsibleTrigger>
        )}

        {/* Expandable Content */}
        {hasExpandableContent && (
          <CollapsibleContent className={'mt-2'}>
            <div className={'space-y-3 border-t border-border pt-3'}>
              {/* Dependencies Section */}
              {hasDependencies && (
                <div>
                  <span className={'text-xs font-medium text-foreground'}>Dependencies</span>
                  <ul className={'mt-1 space-y-0.5'}>
                    {dependencies.map((dep) => (
                      <li className={'truncate text-xs text-muted-foreground'} key={dep}>
                        {dep}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Snippets Section */}
              {hasSnippets && (
                <div>
                  <span className={'text-xs font-medium text-foreground'}>Code Snippets</span>
                  <div className={'mt-1 space-y-2'}>
                    {snippets.map((snippet, index) => {
                      const snippetKey = `${snippet.startLine ?? index}-${snippet.endLine ?? index}`;
                      const hasLineNumbers = snippet.startLine !== undefined || snippet.endLine !== undefined;

                      return (
                        <div className={'rounded-md bg-muted/50 p-2'} key={snippetKey}>
                          {/* Line Numbers */}
                          {hasLineNumbers && (
                            <span className={'text-xs text-muted-foreground'}>
                              Lines {snippet.startLine ?? '?'}-{snippet.endLine ?? '?'}
                            </span>
                          )}
                          {/* Code */}
                          <pre className={'mt-1 overflow-x-auto text-xs text-foreground'}>
                            <code>{snippet.code}</code>
                          </pre>
                          {/* Explanation */}
                          {snippet.explanation && (
                            <p className={'mt-1 text-xs text-muted-foreground'}>{snippet.explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};
