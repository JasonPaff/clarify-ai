'use client';

import type { ReactNode } from 'react';

import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import type { FileType } from '@/lib/validations/file-search';
import type { FileSearchResult, MatchType } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { useBulkAddContextFiles } from '@/hooks/queries/use-feature-request-context-files';
import { useFileSearch } from '@/hooks/queries/use-file-search';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';
import { formValuesToSearchRequest, validateRegexPattern } from '@/lib/validations/file-search';

interface FileSearchDialogProps {
  children?: ReactNode;
  featureRequestId: number;
  onFilesAdded?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  repositories: Array<Repository>;
}

interface Repository {
  id: number;
  name: string;
  path: string;
}

/**
 * Dialog for searching files across repositories and adding them as context files.
 * Supports regex search, include/exclude globs, and multi-select for batch adding.
 */
export const FileSearchDialog = ({
  children,
  featureRequestId,
  onFilesAdded,
  onOpenChange,
  open: controlledOpen,
  repositories,
}: FileSearchDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<null | number>(
    repositories.length === 1 ? (repositories[0]?.id ?? null) : null
  );

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const {
    cancel,
    error: searchError,
    isSearching,
    progress,
    reset: resetSearch,
    response,
    search: executeSearch,
  } = useFileSearch();
  const bulkAddMutation = useBulkAddContextFiles();

  const hasMultipleRepositories = repositories.length > 1;
  const hasResults = response && response.results.length > 0;
  const hasNoResults = response && response.results.length === 0;
  const isAddingFiles = bulkAddMutation.isPending;

  const repositoryOptions = useMemo(() => {
    return repositories.map((repo) => ({
      label: repo.name,
      value: String(repo.id),
    }));
  }, [repositories]);

  const form = useAppForm({
    defaultValues: {
      excludeGlobs: '',
      fileTypes: ['all'] as Array<FileType>,
      includeGlobs: '',
      maxResults: 100,
      query: '',
      snippetDepth: 2,
      useRegex: false,
    },
    onSubmit: async ({ value }) => {
      // Validate regex if enabled
      if (value.useRegex) {
        const validation = validateRegexPattern(value.query);
        if (!validation.isValid) {
          return;
        }
      }

      // Determine which repositories to search
      const searchRepos =
        selectedRepositoryId !== null ? repositories.filter((r) => r.id === selectedRepositoryId) : repositories;

      if (searchRepos.length === 0) {
        return;
      }

      // Convert form values to search request
      const request = formValuesToSearchRequest(
        value,
        searchRepos.map((r) => r.id)
      );

      // Clear previous selections
      setSelectedFiles(new Set());

      // Execute search using the hook's search function
      executeSearch({
        repositories: searchRepos,
        request,
      });
    },
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }

      if (!nextOpen) {
        // Reset state when closing
        form.reset();
        resetSearch();
        setSelectedFiles(new Set());
        setSelectedRepositoryId(repositories.length === 1 ? (repositories[0]?.id ?? null) : null);
      }
    },
    [form, isControlled, onOpenChange, repositories, resetSearch]
  );

  const handleCancelSearch = useCallback(async () => {
    await cancel();
  }, [cancel]);

  const handleToggleFile = useCallback((fileKey: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileKey)) {
        next.delete(fileKey);
      } else {
        next.add(fileKey);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (!response) return;

    const allKeys = response.results.map((r) => `${r.repositoryId}:${r.filePath}`);
    const isAllSelected = allKeys.every((key) => selectedFiles.has(key));

    if (isAllSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allKeys));
    }
  }, [response, selectedFiles]);

  const handleAddSelected = useCallback(async () => {
    if (!response || selectedFiles.size === 0) return;

    // Build the context files to add
    const filesToAdd = response.results
      .filter((result) => selectedFiles.has(`${result.repositoryId}:${result.filePath}`))
      .map((result) => {
        // Find the repository to get its path
        const repo = repositories.find((r) => r.id === result.repositoryId);
        const fullPath = repo ? `${repo.path}/${result.filePath}` : result.filePath;

        // Extract display name from file path
        const pathSegments = result.filePath.split(/[/\\]/);
        const displayName = pathSegments[pathSegments.length - 1] ?? result.filePath;

        return {
          displayName,
          featureRequestId,
          filePath: fullPath,
          fileType: 'repository' as const,
          sizeBytes: 0, // We don't have size info from search
        };
      });

    try {
      await bulkAddMutation.mutateAsync(filesToAdd);
      onFilesAdded?.();
      handleOpenChange(false);
    } catch {
      // Error is handled by the mutation
    }
  }, [bulkAddMutation, featureRequestId, handleOpenChange, onFilesAdded, repositories, response, selectedFiles]);

  const handleRepositoryChange = useCallback((value: string) => {
    setSelectedRepositoryId(value ? Number(value) : null);
  }, []);

  const createFileKey = (result: FileSearchResult): string => {
    return `${result.repositoryId}:${result.filePath}`;
  };

  const getMatchTypeDisplay = (matchType: MatchType | undefined): { label: string; variant: 'default' } => {
    switch (matchType) {
      case 'both':
        return { label: 'Name + Content', variant: 'default' };
      case 'content':
        return { label: 'Content', variant: 'default' };
      case 'filename':
        return { label: 'Name', variant: 'default' };
      default:
        return { label: 'Content', variant: 'default' };
    }
  };

  const getMatchCountText = (result: FileSearchResult): string => {
    const { matchCount, matchType } = result;
    const matchWord = matchCount === 1 ? 'match' : 'matches';

    if (matchType === 'filename') {
      return 'filename match';
    }
    if (matchType === 'both') {
      return `${matchCount} content ${matchWord} + filename`;
    }
    // Default case: content matches or undefined matchType
    return `${matchCount} ${matchWord}`;
  };

  const isAllSelected = useMemo(() => {
    if (!response || response.results.length === 0) return false;
    return response.results.every((r) => selectedFiles.has(createFileKey(r)));
  }, [response, selectedFiles]);

  const triggerContent = children ?? (
    <Button size={'sm'} variant={'outline'}>
      <Search aria-hidden={'true'} className={'mr-2 size-4'} />
      Search Files
    </Button>
  );

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger>{triggerContent}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-h-[85vh] overflow-hidden'} size={'lg'}>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Dialog Header */}
          <DialogTitle>Search Files in Repositories</DialogTitle>
          <DialogDescription>
            Search for files across your linked repositories. Select files to add them as context for this feature
            request.
          </DialogDescription>

          {/* Search Form */}
          <form
            className={'mt-6'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={'flex flex-col gap-4'}>
              {/* Repository Selector - Only show for multi-repo projects */}
              {hasMultipleRepositories && (
                <div className={'flex flex-col gap-1.5'}>
                  <label className={'text-sm font-medium'}>Repository</label>
                  <select
                    className={cn(
                      'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1',
                      'text-sm placeholder:text-muted-foreground',
                      'focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    onChange={(e) => handleRepositoryChange(e.target.value)}
                    value={selectedRepositoryId ? String(selectedRepositoryId) : ''}
                  >
                    <option value={''}>All repositories</option>
                    {repositoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className={'text-xs text-muted-foreground'}>Search in a specific repository or all</p>
                </div>
              )}

              {/* Search Query Field */}
              <form.AppField name={'query'}>
                {(field) => (
                  <field.TextField
                    description={'Search by filename or content. Matches filenames and file contents.'}
                    label={'Search Query'}
                    placeholder={'e.g., button.tsx, handleSubmit, or *.config.*'}
                  />
                )}
              </form.AppField>

              {/* Regex Toggle */}
              <form.AppField name={'useRegex'}>
                {(field) => (
                  <field.SwitchField description={'Enable regular expression pattern matching'} label={'Use Regex'} />
                )}
              </form.AppField>

              {/* Include/Exclude Globs Row */}
              <div className={'grid grid-cols-2 gap-4'}>
                <form.AppField name={'includeGlobs'}>
                  {(field) => (
                    <field.TextField
                      description={'Comma-separated patterns (e.g., *.ts, src/**)'}
                      label={'Include Patterns'}
                      placeholder={'*.ts, *.tsx'}
                    />
                  )}
                </form.AppField>

                <form.AppField name={'excludeGlobs'}>
                  {(field) => (
                    <field.TextField
                      description={'Comma-separated patterns to exclude'}
                      label={'Exclude Patterns'}
                      placeholder={'node_modules/**, dist/**'}
                    />
                  )}
                </form.AppField>
              </div>

              {/* Max Results and Snippet Depth Row */}
              <div className={'grid grid-cols-2 gap-4'}>
                <form.AppField name={'maxResults'}>
                  {(field) => (
                    <field.NumberField
                      description={'Maximum number of files to return'}
                      label={'Max Results'}
                      max={1000}
                      min={1}
                    />
                  )}
                </form.AppField>

                <form.AppField name={'snippetDepth'}>
                  {(field) => (
                    <field.NumberField
                      description={'Lines of context around matches'}
                      label={'Snippet Depth'}
                      max={10}
                      min={0}
                    />
                  )}
                </form.AppField>
              </div>

              {/* Search Button */}
              <div className={'flex justify-end'}>
                {isSearching ? (
                  <Button onClick={handleCancelSearch} type={'button'} variant={'destructive'}>
                    <X className={'mr-2 size-4'} />
                    Cancel Search
                  </Button>
                ) : (
                  <form.AppForm>
                    <form.SubmitButton>
                      <Search className={'mr-2 size-4'} />
                      Search
                    </form.SubmitButton>
                  </form.AppForm>
                )}
              </div>
            </div>
          </form>

          {/* Progress Indicator */}
          {isSearching && progress && (
            <div className={'mt-4 rounded-md border border-border bg-muted/30 p-4'}>
              <div className={'flex items-center gap-3'}>
                <Loader2 className={'size-4 animate-spin text-accent'} />
                <div className={'flex-1'}>
                  <p className={'text-sm font-medium'}>
                    {progress.phase === 'file_discovery' ? 'Discovering files...' : 'Searching content...'}
                  </p>
                  <p className={'text-xs text-muted-foreground'}>
                    {progress.filesProcessed}
                    {progress.totalFiles ? ` of ${progress.totalFiles}` : ''} files processed
                    {progress.currentFile ? ` - ${progress.currentFile}` : null}
                  </p>
                  <p className={'text-xs text-muted-foreground'}>{progress.matchesFound} matches found</p>
                </div>
              </div>
            </div>
          )}

          {/* Searching without progress yet */}
          {isSearching && !progress && (
            <div className={'mt-4 rounded-md border border-border bg-muted/30 p-4'}>
              <div className={'flex items-center gap-3'}>
                <Loader2 className={'size-4 animate-spin text-accent'} />
                <p className={'text-sm font-medium'}>Starting search...</p>
              </div>
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className={'mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4'}>
              <div className={'flex items-center gap-2'}>
                <AlertCircle className={'size-4 text-destructive'} />
                <p className={'text-sm text-destructive'}>{searchError}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {hasNoResults && (
            <div className={'mt-4 rounded-md border border-border bg-muted/30 p-8 text-center'}>
              <Search className={'mx-auto size-8 text-muted-foreground/50'} />
              <p className={'mt-2 text-sm font-medium text-muted-foreground'}>No matches found</p>
              <p className={'text-xs text-muted-foreground'}>Try a different search term or adjust the filters</p>
            </div>
          )}

          {hasResults && (
            <div className={'mt-4 flex flex-col gap-3'}>
              {/* Results Header */}
              <div className={'flex items-center justify-between'}>
                <div className={'flex items-center gap-2'}>
                  <button
                    className={cn(
                      'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground',
                      'rounded-sm focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none'
                    )}
                    onClick={handleToggleAll}
                    type={'button'}
                  >
                    <Checkbox checked={isAllSelected} />
                    <span>Select All ({response.results.length} files)</span>
                  </button>
                </div>
                <span className={'text-xs text-muted-foreground'}>
                  {selectedFiles.size} of {response.results.length} selected
                  {response.hasMore && ' (more results available)'}
                </span>
              </div>

              {/* Results List */}
              <div className={'max-h-60 overflow-y-auto rounded-md border border-border'}>
                {response.results.map((result) => {
                  const fileKey = createFileKey(result);
                  const isSelected = selectedFiles.has(fileKey);
                  const repo = repositories.find((r) => r.id === result.repositoryId);
                  const matchTypeDisplay = getMatchTypeDisplay(result.matchType);
                  const hasSnippets = result.snippets && result.snippets.length > 0;
                  const isFilenameOnlyMatch = !hasSnippets && result.matchType === 'filename';

                  return (
                    <button
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border p-3 text-left',
                        'transition-colors last:border-b-0 hover:bg-muted/50',
                        'focus:bg-muted/50 focus:outline-none',
                        isSelected && 'bg-accent/10'
                      )}
                      key={fileKey}
                      onClick={() => handleToggleFile(fileKey)}
                      type={'button'}
                    >
                      <Checkbox checked={isSelected} className={'mt-0.5'} />
                      <div className={'min-w-0 flex-1'}>
                        <div className={'flex items-center gap-2'}>
                          <p className={'truncate text-sm font-medium'}>{result.filePath}</p>
                          <Badge size={'sm'} variant={matchTypeDisplay.variant}>
                            {matchTypeDisplay.label}
                          </Badge>
                        </div>
                        <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                          {repo && <span>{repo.name}</span>}
                          <span>|</span>
                          <span>{getMatchCountText(result)}</span>
                        </div>

                        {/* Snippets - only shown for content matches */}
                        {hasSnippets ? (
                          <div className={'mt-2 space-y-1'}>
                            {result.snippets?.slice(0, 2).map((snippet, idx) => (
                              <div
                                className={'rounded-sm bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground'}
                                key={idx}
                              >
                                <span className={'text-muted-foreground/70'}>{snippet.lineNumber}:</span>{' '}
                                {snippet.content.length > 80
                                  ? `${snippet.content.substring(0, 80)}...`
                                  : snippet.content}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {/* Filename-only match indicator when no snippets */}
                        {isFilenameOnlyMatch && (
                          <p className={'mt-1 text-xs text-muted-foreground/70 italic'}>
                            Matched by filename pattern
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add Selected Button */}
              <div className={'flex justify-end gap-3 pt-2'}>
                <Button onClick={() => handleOpenChange(false)} type={'button'} variant={'outline'}>
                  Cancel
                </Button>
                <Button
                  disabled={selectedFiles.size === 0 || isAddingFiles}
                  onClick={handleAddSelected}
                  type={'button'}
                >
                  {isAddingFiles ? (
                    <Fragment>
                      <Loader2 className={'mr-2 size-4 animate-spin'} />
                      Adding...
                    </Fragment>
                  ) : (
                    <Fragment>Add Selected ({selectedFiles.size})</Fragment>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Add Error */}
          {bulkAddMutation.isError && (
            <div className={'mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4'}>
              <div className={'flex items-center gap-2'}>
                <AlertCircle className={'size-4 text-destructive'} />
                <p className={'text-sm text-destructive'}>Failed to add files. Please try again.</p>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
