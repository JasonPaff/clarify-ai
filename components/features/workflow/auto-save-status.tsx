'use client';

import { formatDistanceToNow, isValid } from 'date-fns';

interface AutoSaveStatusProps {
  hasUnsavedChanges?: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export const AutoSaveStatus = ({ hasUnsavedChanges = false, isSaving, lastSavedAt }: AutoSaveStatusProps) => {
  const statusText = isSaving
    ? 'Saving...'
    : lastSavedAt && isValid(lastSavedAt)
      ? `Last saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
      : hasUnsavedChanges
        ? 'Not saved yet'
        : null;

  if (!statusText) {
    return null;
  }

  return <span className={'text-xs text-muted-foreground'}>{statusText}</span>;
};
