'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertTriangle, FilePlus, FileSearch, Filter, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DiscoveredFileEntry, DiscoveryFileAction, DiscoveryRiskLevel } from '@/lib/validations/discovery';

import { AddFileDialog } from '@/components/features/discovery/add-file-dialog';
import { FileCard } from '@/components/features/discovery/file-card';
import { FileCardEditor } from '@/components/features/discovery/file-card-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Filter options for actions */
const ACTION_FILTER_OPTIONS: Array<{ label: string; value: 'all' | DiscoveryFileAction }> = [
  { label: 'All Actions', value: 'all' },
  { label: 'Create', value: 'create' },
  { label: 'Delete', value: 'delete' },
  { label: 'Modify', value: 'modify' },
  { label: 'Review', value: 'review' },
];

/** Filter options for risk levels */
const RISK_FILTER_OPTIONS: Array<{ label: string; value: 'all' | DiscoveryRiskLevel }> = [
  { label: 'All Risks', value: 'all' },
  { label: 'High', value: 'high' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
];

interface DiscoveryResultsProps extends ComponentPropsWithRef<'div'> {
  /** The list of discovered files to display */
  discoveredFiles: Array<DiscoveredFileEntry>;
  /** Callback when a file is added manually */
  onAddFile: (file: DiscoveredFileEntry) => void;
  /** Callback when a file is removed */
  onRemoveFile?: (path: string) => void;
  /** Callback when a file entry is updated */
  onUpdateFile: (path: string, updatedFile: DiscoveredFileEntry) => void;
  /** Project ID for the add file dialog */
  projectId: number;
  /** Available repositories for filtering */
  repositories?: Array<RepositoryOption>;
}

/** Repository option for filter dropdown */
interface RepositoryOption {
  id: number;
  name: string;
}

/**
 * Displays the complete discovery output with filtering, editing, and file management capabilities.
 * Shows summary statistics, a scrollable file card list, and supports inline editing.
 */
export const DiscoveryResults = ({
  className,
  discoveredFiles,
  onAddFile,
  onRemoveFile,
  onUpdateFile,
  projectId,
  ref,
  repositories = [],
  ...props
}: DiscoveryResultsProps) => {
  const [actionFilter, setActionFilter] = useState<'all' | DiscoveryFileAction>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | DiscoveryRiskLevel>('all');
  const [repositoryFilter, setRepositoryFilter] = useState<string>('all');
  const [editingFilePath, setEditingFilePath] = useState<null | string>(null);
  const [editingFileData, setEditingFileData] = useState<DiscoveredFileEntry | null>(null);

  // Compute summary statistics
  const statistics = useMemo(() => {
    const byAction: Record<DiscoveryFileAction, number> = {
      create: 0,
      delete: 0,
      modify: 0,
      review: 0,
    };

    const byRisk: Record<DiscoveryRiskLevel, number> = {
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

  // Apply filters to the file list
  const filteredFiles = useMemo(() => {
    return discoveredFiles.filter((file) => {
      const matchesAction = actionFilter === 'all' || file.action === actionFilter;
      const matchesRisk = riskFilter === 'all' || file.risk === riskFilter;
      const matchesRepository = repositoryFilter === 'all' || file.repositoryId === Number(repositoryFilter);

      return matchesAction && matchesRisk && matchesRepository;
    });
  }, [discoveredFiles, actionFilter, riskFilter, repositoryFilter]);

  // Build repository filter options
  const repositoryFilterOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [{ label: 'All Repositories', value: 'all' }];

    for (const repo of repositories) {
      options.push({ label: repo.name, value: String(repo.id) });
    }

    return options;
  }, [repositories]);

  // Derived conditions
  const hasFiles = discoveredFiles.length > 0;
  const hasFilteredFiles = filteredFiles.length > 0;
  const hasActiveFilters = actionFilter !== 'all' || riskFilter !== 'all' || repositoryFilter !== 'all';
  const hasMultipleRepositories = repositories.length > 1;
  const hasHighRiskFiles = statistics.byRisk.high > 0;

  /**
   * Handle action filter change
   */
  const handleActionFilterChange = useCallback((value: 'all' | DiscoveryFileAction | null) => {
    if (value !== null) {
      setActionFilter(value);
    }
  }, []);

  /**
   * Handle risk filter change
   */
  const handleRiskFilterChange = useCallback((value: 'all' | DiscoveryRiskLevel | null) => {
    if (value !== null) {
      setRiskFilter(value);
    }
  }, []);

  /**
   * Handle repository filter change
   */
  const handleRepositoryFilterChange = useCallback((value: null | string) => {
    if (value !== null) {
      setRepositoryFilter(value);
    }
  }, []);

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setActionFilter('all');
    setRiskFilter('all');
    setRepositoryFilter('all');
  }, []);

  /**
   * Start editing a file
   */
  const handleEditStart = useCallback((file: DiscoveredFileEntry) => {
    setEditingFilePath(file.path);
    setEditingFileData({ ...file });
  }, []);

  /**
   * Cancel editing
   */
  const handleEditCancel = useCallback(() => {
    setEditingFilePath(null);
    setEditingFileData(null);
  }, []);

  /**
   * Update the editing file data locally
   */
  const handleEditChange = useCallback((updatedFile: DiscoveredFileEntry) => {
    setEditingFileData(updatedFile);
  }, []);

  /**
   * Save the edited file
   */
  const handleEditSave = useCallback(() => {
    if (editingFilePath && editingFileData) {
      onUpdateFile(editingFilePath, editingFileData);
      setEditingFilePath(null);
      setEditingFileData(null);
    }
  }, [editingFilePath, editingFileData, onUpdateFile]);

  /**
   * Handle adding a new file
   */
  const handleAddFile = useCallback(
    (file: DiscoveredFileEntry) => {
      onAddFile(file);
    },
    [onAddFile]
  );

  /**
   * Handle removing a file
   */
  const handleRemoveFile = useCallback(
    (path: string) => {
      onRemoveFile?.(path);
    },
    [onRemoveFile]
  );

  // Show empty state when no files discovered
  if (!hasFiles) {
    return (
      <div className={cn('rounded-md border border-border bg-background p-6', className)} ref={ref} {...props}>
        <EmptyState
          action={
            <AddFileDialog onAdd={handleAddFile} projectId={projectId}>
              <Button size={'sm'} variant={'outline'}>
                <FilePlus aria-hidden={'true'} className={'mr-2 size-4'} />
                Add File Manually
              </Button>
            </AddFileDialog>
          }
          description={
            'No files were discovered during the analysis. You can manually add files that should be included in the implementation.'
          }
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
            <h3 className={'text-lg font-semibold text-foreground'}>Discovery Results</h3>
            <p className={'mt-0.5 text-sm text-muted-foreground'}>
              {statistics.total} {statistics.total === 1 ? 'file' : 'files'} discovered
            </p>
          </div>

          {/* Add File Button */}
          <AddFileDialog onAdd={handleAddFile} projectId={projectId}>
            <Button size={'sm'} variant={'outline'}>
              <FilePlus aria-hidden={'true'} className={'mr-2 size-4'} />
              Add File
            </Button>
          </AddFileDialog>
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

      {/* Filter Controls */}
      <div className={'border-b border-border bg-muted/30 p-3'}>
        <div className={'flex flex-wrap items-center gap-3'}>
          <div className={'flex items-center gap-1.5 text-muted-foreground'}>
            <Filter aria-hidden={'true'} className={'size-4'} />
            <span className={'text-xs font-medium'}>Filters:</span>
          </div>

          {/* Action Filter */}
          <SelectRoot onValueChange={handleActionFilterChange} value={actionFilter}>
            <SelectTrigger className={'w-32'} size={'sm'}>
              <SelectValue placeholder={'Action'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {ACTION_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Risk Filter */}
          <SelectRoot onValueChange={handleRiskFilterChange} value={riskFilter}>
            <SelectTrigger className={'w-28'} size={'sm'}>
              <SelectValue placeholder={'Risk'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {RISK_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>

          {/* Repository Filter - Only show when multiple repositories */}
          {hasMultipleRepositories && (
            <SelectRoot onValueChange={handleRepositoryFilterChange} value={repositoryFilter}>
              <SelectTrigger className={'w-36'} size={'sm'}>
                <SelectValue placeholder={'Repository'} />
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup size={'sm'}>
                    <SelectList>
                      {repositoryFilterOptions.map((option) => (
                        <SelectItem key={String(option.value)} size={'sm'} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <IconButton aria-label={'Clear all filters'} className={'size-7'} onClick={handleClearFilters}>
              <X className={'size-3.5'} />
            </IconButton>
          )}

          {/* Filter Results Count */}
          {hasActiveFilters && (
            <span className={'text-xs text-muted-foreground'}>
              Showing {filteredFiles.length} of {statistics.total}
            </span>
          )}
        </div>
      </div>

      {/* File List Section */}
      <div className={'max-h-96 overflow-y-auto p-4'}>
        {hasFilteredFiles ? (
          <div className={'space-y-3'}>
            {filteredFiles.map((file) => {
              const isEditing = editingFilePath === file.path;

              if (isEditing && editingFileData) {
                return (
                  <FileCardEditor
                    file={editingFileData}
                    key={file.path}
                    onCancel={handleEditCancel}
                    onChange={handleEditChange}
                    onSave={handleEditSave}
                  />
                );
              }

              return (
                <div className={'group relative'} key={file.path}>
                  <FileCard discoveredFile={file} />
                  {/* Action Overlay Buttons */}
                  <div
                    className={'absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'}
                  >
                    <Button onClick={() => handleEditStart(file)} size={'sm'} variant={'ghost'}>
                      Edit
                    </Button>
                    {onRemoveFile && (
                      <IconButton
                        aria-label={`Remove ${file.path}`}
                        className={'size-7 hover:text-destructive'}
                        onClick={() => handleRemoveFile(file.path)}
                      >
                        <Trash2 className={'size-3.5'} />
                      </IconButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={handleClearFilters} size={'sm'} variant={'outline'}>
                Clear Filters
              </Button>
            }
            description={'No files match the current filter criteria. Try adjusting or clearing the filters.'}
            icon={<Filter className={'size-6'} />}
            title={'No Matching Files'}
          />
        )}
      </div>
    </div>
  );
};
