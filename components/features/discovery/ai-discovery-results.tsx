'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertTriangle, Eye, FileMinus, FilePen, FilePlus, FileSearch, PlusCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type {
  AiDiscoveryFileAction,
  AiDiscoveryFileEntry,
  AiDiscoveryRiskLevel,
} from '@/lib/validations/ai-discovery';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

/**
 * Maps file action types to their corresponding icons
 */
const ACTION_ICONS: Record<AiDiscoveryFileAction, typeof FilePlus> = {
  create: FilePlus,
  delete: FileMinus,
  modify: FilePen,
  review: Eye,
};

/**
 * Maps file action types to their badge variants
 */
const ACTION_BADGE_VARIANTS: Record<AiDiscoveryFileAction, 'completed' | 'default' | 'failed' | 'researching'> = {
  create: 'completed',
  delete: 'failed',
  modify: 'researching',
  review: 'default',
};

/**
 * Maps risk levels to their badge classes
 */
const RISK_LEVEL_CLASSES: Record<AiDiscoveryRiskLevel, string> = {
  high: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  low: 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
};

interface AiDiscoveryResultsProps extends ComponentPropsWithRef<'div'> {
  /** The list of AI-discovered files to display */
  discoveredFiles: Array<AiDiscoveryFileEntry>;
  /** Whether the add to context action is in progress */
  isAddingToContext?: boolean;
  /** Callback when "Add to Context" is clicked with selected file paths */
  onAddToContext?: (selectedPaths: Array<string>) => void;
}

/**
 * Displays AI-discovered files with justifications, checkbox selection,
 * and select-all controls for adding files to context.
 */
export const AiDiscoveryResults = ({
  className,
  discoveredFiles,
  isAddingToContext = false,
  onAddToContext,
  ref,
  ...props
}: AiDiscoveryResultsProps) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Derived conditions
  const hasFiles = discoveredFiles.length > 0;
  const totalFiles = discoveredFiles.length;
  const selectedCount = selectedPaths.size;
  const isAllSelected = hasFiles && selectedCount === totalFiles;
  const isNoneSelected = selectedCount === 0;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalFiles;
  const hasSelection = selectedCount > 0;
  const fileCountLabel = totalFiles === 1 ? 'file' : 'files';
  const selectionSuffix = hasSelection ? ` (${selectedCount} selected)` : '';

  /**
   * Toggle selection for a single file
   */
  const handleToggleFile = useCallback((path: string, isChecked: boolean) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  /**
   * Select all files
   */
  const handleSelectAll = useCallback(() => {
    const allPaths = new Set(discoveredFiles.map((file) => file.path));
    setSelectedPaths(allPaths);
  }, [discoveredFiles]);

  /**
   * Deselect all files
   */
  const handleSelectNone = useCallback(() => {
    setSelectedPaths(new Set());
  }, []);

  /**
   * Toggle select all/none
   */
  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      handleSelectNone();
    } else {
      handleSelectAll();
    }
  }, [isAllSelected, handleSelectAll, handleSelectNone]);

  /**
   * Handle add to context click
   */
  const handleAddToContext = useCallback(() => {
    if (onAddToContext && selectedCount > 0) {
      onAddToContext(Array.from(selectedPaths));
    }
  }, [onAddToContext, selectedCount, selectedPaths]);

  // Compute summary statistics
  const statistics = useMemo(() => {
    const byAction: Record<AiDiscoveryFileAction, number> = {
      create: 0,
      delete: 0,
      modify: 0,
      review: 0,
    };

    const byRisk: Record<AiDiscoveryRiskLevel, number> = {
      high: 0,
      low: 0,
      medium: 0,
    };

    for (const file of discoveredFiles) {
      byAction[file.action]++;
      byRisk[file.risk]++;
    }

    return {
      byAction,
      byRisk,
      total: discoveredFiles.length,
    };
  }, [discoveredFiles]);

  const hasHighRiskFiles = statistics.byRisk.high > 0;

  // Show empty state when no files discovered
  if (!hasFiles) {
    return (
      <div className={cn('rounded-md border border-border bg-background p-6', className)} ref={ref} {...props}>
        <EmptyState
          description={'No relevant files were discovered during AI analysis.'}
          icon={<FileSearch className={'size-6'} />}
          title={'No Files Discovered'}
        />
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border border-border bg-background', className)} ref={ref} {...props}>
      {/* Header Section */}
      <div className={'border-b border-border p-4'}>
        <div className={'flex items-center justify-between gap-4'}>
          {/* Title and Stats */}
          <div>
            <h3 className={'text-lg font-semibold text-foreground'}>AI Discovery Results</h3>
            <p className={'mt-0.5 text-sm text-muted-foreground'}>
              {totalFiles} {fileCountLabel} discovered{selectionSuffix}
            </p>
          </div>

          {/* Add to Context Button */}
          <Button
            disabled={isNoneSelected || isAddingToContext}
            onClick={handleAddToContext}
            size={'sm'}
            variant={'default'}
          >
            <PlusCircle aria-hidden={'true'} className={'mr-2 size-4'} />
            {isAddingToContext ? 'Adding...' : 'Add to Context'}
          </Button>
        </div>

        {/* Summary Statistics */}
        <div className={'mt-4 flex flex-wrap gap-4'}>
          {/* Action Stats */}
          <div className={'flex items-center gap-2'}>
            <span className={'text-xs text-muted-foreground'}>By Action:</span>
            <div className={'flex gap-1.5'}>
              {statistics.byAction.create > 0 && (
                <Badge size={'sm'} variant={'completed'}>
                  {statistics.byAction.create} create
                </Badge>
              )}
              {statistics.byAction.modify > 0 && (
                <Badge size={'sm'} variant={'researching'}>
                  {statistics.byAction.modify} modify
                </Badge>
              )}
              {statistics.byAction.delete > 0 && (
                <Badge size={'sm'} variant={'failed'}>
                  {statistics.byAction.delete} delete
                </Badge>
              )}
              {statistics.byAction.review > 0 && (
                <Badge size={'sm'} variant={'default'}>
                  {statistics.byAction.review} review
                </Badge>
              )}
            </div>
          </div>

          {/* Risk Stats */}
          <div className={'flex items-center gap-2'}>
            <span className={'text-xs text-muted-foreground'}>By Risk:</span>
            <div className={'flex gap-1.5'}>
              {statistics.byRisk.low > 0 && (
                <span
                  className={
                    'inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  }
                >
                  {statistics.byRisk.low} low
                </span>
              )}
              {statistics.byRisk.medium > 0 && (
                <span
                  className={
                    'inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }
                >
                  {statistics.byRisk.medium} medium
                </span>
              )}
              {hasHighRiskFiles && (
                <span
                  className={
                    'inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }
                >
                  <AlertTriangle aria-hidden={'true'} className={'size-3'} />
                  {statistics.byRisk.high} high
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Select All Controls */}
      <div className={'flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2'}>
        <Checkbox
          aria-label={isAllSelected ? 'Deselect all files' : 'Select all files'}
          checked={isAllSelected}
          indeterminate={isSomeSelected}
          onCheckedChange={handleToggleSelectAll}
          size={'sm'}
        />
        <div className={'flex items-center gap-2'}>
          <Button
            className={'h-auto px-2 py-1'}
            disabled={isAllSelected}
            onClick={handleSelectAll}
            size={'sm'}
            variant={'ghost'}
          >
            Select All
          </Button>
          <span className={'text-muted-foreground'}>/</span>
          <Button
            className={'h-auto px-2 py-1'}
            disabled={isNoneSelected}
            onClick={handleSelectNone}
            size={'sm'}
            variant={'ghost'}
          >
            Select None
          </Button>
        </div>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {selectedCount} of {totalFiles} selected
        </span>
      </div>

      {/* File List Section */}
      <div className={'max-h-96 overflow-y-auto'}>
        <div className={'divide-y divide-border'}>
          {discoveredFiles.map((file) => {
            const isSelected = selectedPaths.has(file.path);
            const ActionIcon = ACTION_ICONS[file.action];
            const actionBadgeVariant = ACTION_BADGE_VARIANTS[file.action];
            const riskClasses = RISK_LEVEL_CLASSES[file.risk];

            // Extract filename from path
            const fileName = file.path.split('/').pop() ?? file.path;
            const directoryPath = file.path.slice(0, file.path.lastIndexOf('/')) || '.';

            return (
              <div
                className={cn(
                  'flex items-start gap-3 p-3 transition-colors',
                  'hover:bg-muted/30',
                  isSelected && 'bg-accent/5'
                )}
                key={file.path}
              >
                {/* Checkbox */}
                <Checkbox
                  aria-label={`Select ${file.path}`}
                  checked={isSelected}
                  className={'mt-0.5'}
                  onCheckedChange={(checked) => handleToggleFile(file.path, checked === true)}
                  size={'sm'}
                />

                {/* File Info */}
                <div className={'min-w-0 flex-1'}>
                  {/* Header Row */}
                  <div className={'flex items-start justify-between gap-3'}>
                    <div className={'flex min-w-0 flex-1 items-start gap-2'}>
                      <ActionIcon
                        aria-hidden={'true'}
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          file.action === 'create' && 'text-green-600 dark:text-green-400',
                          file.action === 'delete' && 'text-red-600 dark:text-red-400',
                          file.action === 'modify' && 'text-blue-600 dark:text-blue-400',
                          file.action === 'review' && 'text-muted-foreground'
                        )}
                      />
                      <div className={'min-w-0 flex-1'}>
                        {/* File Name */}
                        <span className={'truncate font-medium text-foreground'}>{fileName}</span>
                        {/* Directory Path */}
                        <p className={'truncate text-xs text-muted-foreground'}>{directoryPath}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className={'flex shrink-0 items-center gap-2'}>
                      <Badge size={'sm'} variant={actionBadgeVariant}>
                        {file.action}
                      </Badge>
                      <span
                        className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', riskClasses)}
                      >
                        {file.risk === 'high' && <AlertTriangle aria-hidden={'true'} className={'mr-1 size-3'} />}
                        {file.risk}
                      </span>
                      {file.confidence !== undefined && (
                        <span className={'text-xs text-muted-foreground'}>{file.confidence}%</span>
                      )}
                    </div>
                  </div>

                  {/* Justification */}
                  <p className={'mt-1.5 line-clamp-2 text-sm text-muted-foreground'}>{file.justification}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
