'use client';

import type { ChangeEvent } from 'react';

import { useStore } from '@tanstack/react-form';
import { formatDistanceToNow, isValid } from 'date-fns';
import { AlertCircle, ChevronDown, FileText, FolderGit2, Loader2 } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { RepositorySelector } from '@/components/features/repository-selector';
import { ContextFilePicker } from '@/components/features/workflow/context-file-picker';
import { RepositoryOverviewRegenerateDialog } from '@/components/features/workflow/repository-overview-regenerate-dialog';
import { RepositoryOverviewStatusPanel } from '@/components/features/workflow/repository-overview-status-panel';
import { TokenEstimationWarning } from '@/components/features/workflow/token-estimation-warning';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useContextFiles } from '@/hooks/queries/use-feature-request-context-files';
import {
  useFeatureRequestRepositories,
  useSetFeatureRequestRepositories,
} from '@/hooks/queries/use-feature-request-repositories';
import { useMarkStepsStale, useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewTokens } from '@/hooks/queries/use-repository-overviews';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';
import { repositorySelectionFormSchema } from '@/lib/validations/feature-request-repositories';
import { getDownstreamSteps } from '@/lib/workflow/stale-detection';

interface DescribeStepProps {
  featureRequest: FeatureRequest;
  projectId: number;
}

const parseSqliteUtc = (value: null | string | undefined): Date | null => {
  if (!value) return null;
  const normalized = value.endsWith('Z') ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const DescribeStep = ({ featureRequest, projectId }: DescribeStepProps) => {
  const [content, setContent] = useState(featureRequest.rawRequest ?? '');
  const [originalContent, setOriginalContent] = useState(featureRequest.rawRequest ?? '');
  // SQLite CURRENT_TIMESTAMP stores UTC without 'Z' suffix, so we append it
  // to ensure JavaScript parses it as UTC, not local time
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    featureRequest.rawRequest ? parseSqliteUtc(featureRequest.updatedAt) : null
  );
  const [trackedFeatureId, setTrackedFeatureId] = useState(featureRequest.id);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [selectedRepositoryIdForRegenerate, setSelectedRepositoryIdForRegenerate] = useState<null | number>(null);

  const updateMutation = useUpdateFeatureRequest();
  const markStepsStaleMutation = useMarkStepsStale();

  // Repository selection hooks
  const {
    data: featureRequestRepositoryIds = [],
    isError: isFeatureRepositoriesError,
    isPending: isLoadingFeatureRepositories,
  } = useFeatureRequestRepositories(featureRequest.id);
  const {
    data: projectRepositories = [],
    isError: isProjectRepositoriesError,
    isPending: isLoadingProjectRepositories,
  } = useRepositories(projectId);
  const setRepositories = useSetFeatureRequestRepositories();

  // Context files and token estimation hooks
  const { data: contextFiles = [] } = useContextFiles(featureRequest.id);

  // Repository selection form
  const repositoryForm = useAppForm({
    defaultValues: {
      repositoryIds: [] as Array<number>,
    },
    validators: {
      onSubmit: repositorySelectionFormSchema,
    },
  });

  // Track which feature's repositories have been initialized (to prevent re-initialization)
  const initializedFeatureIdRef = useRef<null | number>(null);

  // Reset state when featureRequest changes
  if (featureRequest.id !== trackedFeatureId) {
    setTrackedFeatureId(featureRequest.id);
    setContent(featureRequest.rawRequest ?? '');
    setOriginalContent(featureRequest.rawRequest ?? '');
    setLastSavedAt(featureRequest.rawRequest ? parseSqliteUtc(featureRequest.updatedAt) : null);
    repositoryForm.reset();
  }

  const isDirty = content !== originalContent;
  const isSaving = updateMutation.isPending;

  const handleSave = useCallback(async () => {
    if (content === originalContent || updateMutation.isPending) return;

    await updateMutation.mutateAsync({
      data: { rawRequest: content },
      id: featureRequest.id,
    });

    // Check if clarification was previously completed - if so, mark all downstream steps as stale
    // since the upstream content has changed
    const clarificationWasCompleted = featureRequest.clarificationStatus === 'completed';
    if (clarificationWasCompleted) {
      const downstreamSteps = getDownstreamSteps('describe');
      if (downstreamSteps.length > 0) {
        void markStepsStaleMutation.mutateAsync({
          featureRequestId: featureRequest.id,
          steps: [...downstreamSteps],
        });
      }
    }

    setOriginalContent(content);
    setLastSavedAt(new Date());
  }, [content, featureRequest, markStepsStaleMutation, originalContent, updateMutation]);

  const handleContentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  }, []);

  const { debounced: debouncedSave, flush: flushSave } = useDebouncedCallback(
    () => {
      void handleSave();
    },
    { delay: 1500 }
  );

  const handleContentBlur = useCallback(() => {
    flushSave();
  }, [flushSave]);

  // Trigger debounced save when content changes
  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
  }, [isDirty, content, debouncedSave]);

  // Sync repository form with fetched data or project defaults
  // "Inherit with edit" behavior: use feature-level selection if it exists,
  // otherwise fall back to all project repositories
  useEffect(() => {
    const isDataLoaded = !isLoadingFeatureRepositories && !isLoadingProjectRepositories;
    const isNotYetInitialized = initializedFeatureIdRef.current !== featureRequest.id;

    if (isDataLoaded && isNotYetInitialized) {
      // Mark as initialized for this feature to prevent re-running
      initializedFeatureIdRef.current = featureRequest.id;

      // If feature request has saved repositories, use them
      // Otherwise, fall back to all project repositories (inherit from project)
      const hasFeatureRepositories = featureRequestRepositoryIds.length > 0;
      const initialRepositoryIds = hasFeatureRepositories
        ? featureRequestRepositoryIds
        : projectRepositories.map((repo) => repo.id);

      repositoryForm.setFieldValue('repositoryIds', initialRepositoryIds);

      // If inheriting from project defaults and there are repositories to inherit,
      // save them to the feature request for future persistence
      if (!hasFeatureRepositories && initialRepositoryIds.length > 0) {
        void setRepositories.mutateAsync({
          featureRequestId: featureRequest.id,
          repositoryIds: initialRepositoryIds,
        });
      }
    }
  }, [
    featureRequest.id,
    featureRequestRepositoryIds,
    isLoadingFeatureRepositories,
    isLoadingProjectRepositories,
    projectRepositories,
    repositoryForm,
    setRepositories,
  ]);

  const handleRepositoryChange = useCallback(
    async (newRepositoryIds: Array<number>) => {
      // Prevent saving if no repositories selected - at least one is required
      if (newRepositoryIds.length === 0) {
        return;
      }
      await setRepositories.mutateAsync({
        featureRequestId: featureRequest.id,
        repositoryIds: newRepositoryIds,
      });
    },
    [featureRequest.id, setRepositories]
  );

  // Use useStore for reactive updates when repository selection changes
  const [selectedRepositoryIds] = useStore(repositoryForm.store, (state) => [state.values.repositoryIds ?? []]);
  const isRepositorySaving = setRepositories.isPending;

  // Repository overview token estimation
  const { totalTokens: repositoryOverviewTokens } = useRepositoryOverviewTokens(selectedRepositoryIds);

  const handleOverviewRegenerate = useCallback((repositoryId: number) => {
    setSelectedRepositoryIdForRegenerate(repositoryId);
    setIsRegenerateDialogOpen(true);
  }, []);

  const handleRegenerateDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsRegenerateDialogOpen(isOpen);
    if (!isOpen) {
      setSelectedRepositoryIdForRegenerate(null);
    }
  }, []);

  // Get the selected repository data for the regenerate dialog
  const selectedRepositoryForRegenerate = useMemo(() => {
    if (selectedRepositoryIdForRegenerate === null) return null;
    return projectRepositories.find((repo) => repo.id === selectedRepositoryIdForRegenerate) ?? null;
  }, [projectRepositories, selectedRepositoryIdForRegenerate]);

  const hasSelectedRepositories = selectedRepositoryIds.length > 0;
  const isRepositoryDataLoading = isLoadingFeatureRepositories || isLoadingProjectRepositories;
  const isRepositoryDataError = isFeatureRepositoriesError || isProjectRepositoriesError;
  const hasNoProjectRepositories = !isLoadingProjectRepositories && projectRepositories.length === 0;
  const isRepositorySelectionReady = !isRepositoryDataLoading && !isRepositoryDataError && !hasNoProjectRepositories;

  const saveStatusText = isSaving
    ? 'Saving...'
    : lastSavedAt && isValid(lastSavedAt)
      ? `Last saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
      : 'Not saved yet';

  const hasContextFiles = contextFiles.length > 0;

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Section 1: Feature Description (always visible) */}
      <section className={'flex flex-col gap-3'}>
        <div className={'flex items-center gap-2'}>
          <h3 className={'text-sm font-semibold'}>Feature Description</h3>
        </div>

        <Textarea
          className={'min-h-64'}
          onBlur={handleContentBlur}
          onChange={handleContentChange}
          placeholder={
            'Describe your feature request in detail...\n\n' +
            'For example:\n' +
            '- What problem does this feature solve?\n' +
            '- Who will use this feature?\n' +
            '- What should the user experience be like?\n' +
            '- Are there any specific technical requirements?'
          }
          rows={12}
          value={content}
        />

        {/* Save Status */}
        <div className={'flex items-center justify-between'}>
          <span className={'text-xs text-muted-foreground'}>{saveStatusText}</span>
        </div>

        {/* Save Error */}
        {updateMutation.isError && (
          <Alert variant={'destructive'}>
            <AlertCircle className={'size-4'} />
            <AlertDescription>
              Failed to save changes. Your content is preserved locally and will be retried automatically.
            </AlertDescription>
          </Alert>
        )}
      </section>

      {/* Visual Separator */}
      <hr className={'border-border'} />

      {/* Section 2: Repository Context (collapsed by default) */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm',
            'transition-colors hover:bg-muted/50'
          )}
          isHideChevron
        >
          <div className={'flex items-center gap-2'}>
            <FolderGit2 className={'size-4 text-muted-foreground'} />
            <span className={'font-medium'}>Repository Context</span>
            {hasSelectedRepositories && (
              <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>
                {selectedRepositoryIds.length} selected
              </span>
            )}
          </div>
          <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
        </CollapsibleTrigger>

        <CollapsibleContent className={'mt-3'}>
          <div className={'flex flex-col gap-4'}>
            {/* Loading State */}
            {isRepositoryDataLoading && (
              <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
                <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
                <span className={'text-sm text-muted-foreground'}>Loading repositories...</span>
              </div>
            )}

            {/* Error State */}
            {isRepositoryDataError && !isRepositoryDataLoading && (
              <Alert variant={'destructive'}>
                <AlertCircle className={'size-4'} />
                <AlertDescription>Failed to load repository data. Please try refreshing the page.</AlertDescription>
              </Alert>
            )}

            {/* Empty State - No repositories in project */}
            {hasNoProjectRepositories && !isRepositoryDataError && (
              <Alert>
                <AlertCircle className={'size-4'} />
                <AlertDescription>
                  No repositories found for this project. Add repositories in project settings to enable repository
                  context for AI planning.
                </AlertDescription>
              </Alert>
            )}

            {/* Repository Selection - only show when data is loaded and we have repositories */}
            {isRepositorySelectionReady && (
              <Fragment>
                <repositoryForm.AppField
                  listeners={{
                    onChange: ({ value }) => {
                      void handleRepositoryChange(value);
                    },
                  }}
                  name={'repositoryIds'}
                >
                  {() => (
                    <RepositorySelector
                      description={
                        selectedRepositoryIds.length > 0
                          ? `${selectedRepositoryIds.length} repository(ies) selected. Based on project defaults. Changes apply only to this feature.`
                          : 'Based on project defaults. Changes apply only to this feature.'
                      }
                      isDisabled={isRepositorySaving}
                      isRequired
                      label={'Target Repositories'}
                      projectId={projectId}
                    />
                  )}
                </repositoryForm.AppField>

                {/* Repository Save Status */}
                {isRepositorySaving && (
                  <p className={'text-xs text-muted-foreground'}>Saving repository selection...</p>
                )}

                {/* Repository Save Error */}
                {setRepositories.isError && (
                  <Alert variant={'destructive'}>
                    <AlertCircle className={'size-4'} />
                    <AlertDescription>Failed to save repository selection. Please try again.</AlertDescription>
                  </Alert>
                )}

                {/* No Repository Warning */}
                {!hasSelectedRepositories && (
                  <Alert variant={'destructive'}>
                    <AlertCircle className={'size-4'} />
                    <AlertDescription>
                      At least one repository must be selected for AI planning to work.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Repository Overview Status Panel */}
                {hasSelectedRepositories && (
                  <RepositoryOverviewStatusPanel
                    onRegenerate={handleOverviewRegenerate}
                    projectId={projectId}
                    repositoryIds={selectedRepositoryIds}
                  />
                )}
              </Fragment>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 3: Additional Context (collapsed by default) */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm',
            'transition-colors hover:bg-muted/50'
          )}
          isHideChevron
        >
          <div className={'flex items-center gap-2'}>
            <FileText className={'size-4 text-muted-foreground'} />
            <span className={'font-medium'}>Additional Context Files</span>
            {hasContextFiles && (
              <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>
                {contextFiles.length} file{contextFiles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
        </CollapsibleTrigger>

        <CollapsibleContent className={'mt-3'}>
          <div className={'flex flex-col gap-3'}>
            <p className={'text-xs text-muted-foreground'}>
              Add specific files from your codebase to include as context in the AI planning process. These files
              provide essential implementation details that help generate more accurate plans.
            </p>

            <ContextFilePicker featureRequestId={featureRequest.id} />

            {/* Token Estimation Warning */}
            <TokenEstimationWarning
              contextFiles={contextFiles}
              modelContextLimit={200000}
              repositoryOverviewTokens={repositoryOverviewTokens}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Visual Separator */}
      <hr className={'border-border'} />

      {/* Repository Overview Regenerate Dialog */}
      {selectedRepositoryForRegenerate && (
        <RepositoryOverviewRegenerateDialog
          onOpenChange={handleRegenerateDialogOpenChange}
          open={isRegenerateDialogOpen}
          projectId={projectId}
          repositoryId={selectedRepositoryForRegenerate.id}
          repositoryName={selectedRepositoryForRegenerate.name}
          repositoryPath={selectedRepositoryForRegenerate.path}
        />
      )}
    </div>
  );
};
