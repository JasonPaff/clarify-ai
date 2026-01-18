'use client';

import type { ComponentPropsWithRef } from 'react';

import { Key, Pencil, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

import type { ApiKeyInfo, ApiKeyProvider } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

interface ApiKeyTableProps extends ComponentPropsWithRef<'div'> {
  apiKeys: Array<ApiKeyInfo>;
  onDelete?: (provider: ApiKeyProvider) => void;
  onEdit?: (provider: ApiKeyProvider) => void;
}

export const ApiKeyTable = ({ apiKeys, className, onDelete, onEdit, ref, ...props }: ApiKeyTableProps) => {
  // Derived values for conditional rendering
  const _hasApiKeys = apiKeys.length > 0;

  // Event handlers
  const handleEditClick = (provider: ApiKeyProvider) => {
    onEdit?.(provider);
  };

  const handleDeleteClick = (provider: ApiKeyProvider) => {
    onDelete?.(provider);
  };

  return (
    <div className={cn('w-full', className)} ref={ref} {...props}>
      {/* Empty State */}
      {!_hasApiKeys && (
        <EmptyState
          description={'Add API keys to enable AI-powered features like feature refinement and implementation planning.'}
          icon={<Key className={'size-5'} />}
          title={'No API keys configured'}
        />
      )}

      {/* API Keys Table */}
      {_hasApiKeys && (
        <div className={'overflow-hidden rounded-lg border border-border'}>
          {/* Table Header */}
          <div
            className={`
              grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-4 border-b border-border bg-muted/50
              px-4 py-3 text-xs font-medium text-muted-foreground
            `}
          >
            <div>Provider</div>
            <div>API Key</div>
            <div>Source</div>
            <div>Notes</div>
            <div className={'text-right'}>Actions</div>
          </div>

          {/* Table Body */}
          <div className={'divide-y divide-border'}>
            {apiKeys.map((entry) => (
              <ApiKeyTableRow
                entry={entry}
                key={entry.provider}
                onDelete={() => handleDeleteClick(entry.provider)}
                onEdit={() => handleEditClick(entry.provider)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ApiKeyTableRowProps {
  entry: ApiKeyInfo;
  onDelete: () => void;
  onEdit: () => void;
}

const ApiKeyTableRow = ({ entry, onDelete, onEdit }: ApiKeyTableRowProps) => {
  // Derived values
  const _isUserKey = entry.source === 'user';
  const _hasNotes = entry.notes && entry.notes.trim().length > 0;

  // Format provider name for display
  const providerDisplayName = getProviderDisplayName(entry.provider);

  return (
    <div
      className={`
        grid grid-cols-[1fr_1fr_auto_1fr_auto] items-center gap-4 px-4 py-3
        transition-colors hover:bg-muted/30
      `}
    >
      {/* Provider */}
      <div className={'flex items-center gap-2'}>
        <Badge variant={entry.provider}>{providerDisplayName}</Badge>
      </div>

      {/* Masked Key */}
      <div className={'font-mono text-sm text-muted-foreground'}>{entry.maskedKey}</div>

      {/* Source */}
      <div>
        <Badge size={'sm'} variant={entry.source}>
          {entry.source === 'environment' ? 'Environment' : 'User'}
        </Badge>
      </div>

      {/* Notes */}
      <div className={'min-w-0'}>
        {_hasNotes ? (
          <p className={'truncate text-sm text-muted-foreground'} title={entry.notes}>
            {entry.notes}
          </p>
        ) : (
          <span className={'text-sm text-muted-foreground/50'}>-</span>
        )}
      </div>

      {/* Actions */}
      <div className={'flex justify-end gap-1'}>
        {_isUserKey && (
          <Fragment>
            <IconButton aria-label={`Edit ${providerDisplayName} API key`} onClick={onEdit} type={'button'}>
              <Pencil className={'size-4'} />
            </IconButton>
            <IconButton aria-label={`Delete ${providerDisplayName} API key`} onClick={onDelete} type={'button'}>
              <Trash2 className={'size-4'} />
            </IconButton>
          </Fragment>
        )}
        {!_isUserKey && <span className={'px-2 text-xs text-muted-foreground/50'}>Read-only</span>}
      </div>
    </div>
  );
};

// Helper function to format provider names
const getProviderDisplayName = (provider: ApiKeyProvider): string => {
  const displayNames: Record<ApiKeyProvider, string> = {
    anthropic: 'Anthropic',
    google: 'Google',
    openai: 'OpenAI',
  };
  return displayNames[provider];
};
