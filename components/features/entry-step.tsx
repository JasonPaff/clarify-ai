'use client';

import type { ChangeEvent } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquareMore, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { ClarificationPanel } from '@/components/features/clarification/clarification-panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { parseClarificationStatus } from '@/lib/validations/clarification';

interface EntryStepProps {
  featureRequest: FeatureRequest;
}

export const EntryStep = ({ featureRequest }: EntryStepProps) => {
  const [content, setContent] = useState(featureRequest.rawRequest ?? '');
  const [originalContent, setOriginalContent] = useState(featureRequest.rawRequest ?? '');
  // SQLite CURRENT_TIMESTAMP stores UTC without 'Z' suffix, so we append it
  // to ensure JavaScript parses it as UTC, not local time
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    featureRequest.rawRequest ? new Date(featureRequest.updatedAt + 'Z') : null
  );
  const [trackedFeatureId, setTrackedFeatureId] = useState(featureRequest.id);
  const [showClarification, setShowClarification] = useState(false);

  const updateMutation = useUpdateFeatureRequest();

  // Parse clarification status from feature request
  const clarificationStatus = parseClarificationStatus(featureRequest.clarificationStatus);

  // Reset state when featureRequest changes
  if (featureRequest.id !== trackedFeatureId) {
    setTrackedFeatureId(featureRequest.id);
    setContent(featureRequest.rawRequest ?? '');
    setOriginalContent(featureRequest.rawRequest ?? '');
    setLastSavedAt(featureRequest.rawRequest ? new Date(featureRequest.updatedAt + 'Z') : null);
    setShowClarification(false);
  }

  const isDirty = content !== originalContent;
  const isSaving = updateMutation.isPending;
  const hasContent = content.trim().length > 0;

  // Determine if refine button should be enabled
  const canRefine = clarificationStatus === 'completed' || clarificationStatus === 'skipped';

  const handleSave = useCallback(async () => {
    if (content === originalContent || updateMutation.isPending) return;

    await updateMutation.mutateAsync({
      data: { rawRequest: content },
      id: featureRequest.id,
    });

    setOriginalContent(content);
    setLastSavedAt(new Date());
  }, [content, featureRequest.id, originalContent, updateMutation]);

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

  const saveStatusText = isSaving
    ? 'Saving...'
    : lastSavedAt
      ? `Last saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
      : 'Not saved yet';

  return (
    <div className={'flex flex-col gap-4'}>
      {/* Textarea Section */}
      <div className={'flex flex-col gap-2'}>
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

        {/* Save Status Row */}
        <div className={'flex items-center justify-between'}>
          <span className={'text-xs text-muted-foreground'}>{saveStatusText}</span>
        </div>
      </div>

      {/* Action Buttons Section */}
      {hasContent && !showClarification && (
        <div className={'flex gap-2'}>
          <Button disabled={isSaving} onClick={() => setShowClarification(true)} variant={'outline'}>
            <MessageSquareMore className={'size-4'} />
            Clarify Request
          </Button>
          <Button disabled={!canRefine} variant={'default'}>
            <Sparkles className={'size-4'} />
            Refine Requirements
          </Button>
        </div>
      )}

      {/* Clarification Panel */}
      {showClarification && (
        <ClarificationPanel
          featureRequest={featureRequest}
          onClose={() => setShowClarification(false)}
          onComplete={() => setShowClarification(false)}
        />
      )}
    </div>
  );
};
