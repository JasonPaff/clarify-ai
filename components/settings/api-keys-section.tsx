'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertCircle, Key, Plus, ShieldAlert } from 'lucide-react';
import { Fragment, useState } from 'react';

import type { ApiKeyInfo, ApiKeyProvider } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiKeys, useEncryptionAvailable } from '@/hooks/queries/use-api-keys';
import { cn } from '@/lib/utils';

import { ApiKeyDialog } from './api-key-dialog';
import { ApiKeyTable } from './api-key-table';
import { DeleteApiKeyDialog } from './delete-api-key-dialog';

type ApiKeysSectionProps = ComponentPropsWithRef<'div'>;

export const ApiKeysSection = ({ className, ref, ...props }: ApiKeysSectionProps) => {
  // useState hooks
  const [deletingKey, setDeletingKey] = useState<ApiKeyInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Other hooks
  const apiKeysQuery = useApiKeys();
  const encryptionQuery = useEncryptionAvailable();

  // Derived values for conditional rendering
  const _isLoading = apiKeysQuery.isLoading || encryptionQuery.isLoading;
  const _isEncryptionAvailable = encryptionQuery.data === true;
  const _apiKeys = apiKeysQuery.data ?? [];

  // Event handlers
  const handleDelete = (provider: ApiKeyProvider) => {
    const keyEntry = _apiKeys.find((key) => key.provider === provider);
    if (keyEntry) {
      setDeletingKey(keyEntry);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteDialogOpenChange = (isOpen: boolean) => {
    setIsDeleteDialogOpen(isOpen);
    if (!isOpen) {
      setDeletingKey(null);
    }
  };

  return (
    <Card className={cn(className)} ref={ref} {...props}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center justify-between'}>
          <div className={'flex items-center gap-3'}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg bg-accent/10
                text-accent
              `}
            >
              <Key className={'size-5'} />
            </div>
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for AI providers</CardDescription>
            </div>
          </div>

          {/* Add API Key Button */}
          <ApiKeyDialog mode={'create'}>
            <Button size={'sm'}>
              <Plus className={'size-4'} />
              Add API Key
            </Button>
          </ApiKeyDialog>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent>
        {/* Encryption Warning */}
        {!_isLoading && !_isEncryptionAvailable && (
          <div
            className={`
              mb-6 flex items-start gap-3 rounded-lg border border-destructive/50
              bg-destructive/5 p-4
            `}
          >
            <ShieldAlert className={'mt-0.5 size-5 shrink-0 text-destructive'} />
            <div>
              <p className={'text-sm font-medium text-destructive'}>Encryption Not Available</p>
              <p className={'mt-1 text-sm text-muted-foreground'}>
                Secure storage is not available on this system. API keys will be stored in plain text.
                This may be a security risk.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {_isLoading && <ApiKeysSkeleton />}

        {/* Error State */}
        {!_isLoading && apiKeysQuery.isError && (
          <div
            className={`
              flex items-start gap-3 rounded-lg border border-destructive/50
              bg-destructive/5 p-4
            `}
          >
            <AlertCircle className={'mt-0.5 size-5 shrink-0 text-destructive'} />
            <div>
              <p className={'text-sm font-medium text-destructive'}>Failed to Load API Keys</p>
              <p className={'mt-1 text-sm text-muted-foreground'}>
                {apiKeysQuery.error?.message ?? 'An error occurred while loading API keys.'}
              </p>
            </div>
          </div>
        )}

        {/* API Keys Content with Actions */}
        {!_isLoading && !apiKeysQuery.isError && (
          <ApiKeysContent apiKeys={_apiKeys} onDelete={handleDelete} />
        )}

        {/* Delete Dialog (controlled) */}
        {deletingKey && (
          <DeleteApiKeyDialog
            apiKey={deletingKey}
            onOpenChange={handleDeleteDialogOpenChange}
            open={isDeleteDialogOpen}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Auto-opening dialog wrapper
interface ApiKeyDialogAutoOpenProps {
  existingKey: ApiKeyInfo;
  mode: 'edit';
  onOpenChange?: (isOpen: boolean) => void;
}

// Separate component for API keys content with edit functionality
interface ApiKeysContentProps {
  apiKeys: Array<ApiKeyInfo>;
  onDelete: (provider: ApiKeyProvider) => void;
}

// Wrapper to handle edit dialog with auto-open behavior
interface EditApiKeyDialogWrapperProps {
  existingKey: ApiKeyInfo;
  onClose: () => void;
}

function ApiKeyDialogAutoOpen({ existingKey, mode, onOpenChange }: ApiKeyDialogAutoOpenProps) {
  // Since ApiKeyDialog uses internal state, we need to trigger it manually
  // We'll use a ref to click the hidden trigger button on mount

  return (
    <ApiKeyDialog existingKey={existingKey} mode={mode}>
      <button
        className={'sr-only'}
        onClick={() => onOpenChange?.(true)}
        ref={(el) => {
          // Auto-click the trigger when mounted
          if (el) {
            el.click();
          }
        }}
        type={'button'}
      >
        Edit API Key
      </button>
    </ApiKeyDialog>
  );
}

function ApiKeysContent({ apiKeys, onDelete }: ApiKeysContentProps) {
  // useState hooks
  const [editingProvider, setEditingProvider] = useState<ApiKeyProvider | null>(null);

  // Derived values
  const _editingKey = editingProvider
    ? apiKeys.find((key) => key.provider === editingProvider)
    : null;

  // Event handlers
  const handleEdit = (provider: ApiKeyProvider) => {
    setEditingProvider(provider);
  };

  const handleEditDialogClosed = () => {
    setEditingProvider(null);
  };

  return (
    <Fragment>
      {/* API Keys Table */}
      <ApiKeyTable apiKeys={apiKeys} onDelete={onDelete} onEdit={handleEdit} />

      {/* Edit Dialog - renders when editingProvider is set */}
      {_editingKey && (
        <EditApiKeyDialogWrapper
          existingKey={_editingKey}
          onClose={handleEditDialogClosed}
        />
      )}
    </Fragment>
  );
}

// Loading skeleton
function ApiKeysSkeleton() {
  return (
    <div className={'space-y-0'}>
      {/* Table Header Skeleton */}
      <div
        className={`
          grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-4 rounded-t-lg border border-border
          bg-muted/50 px-4 py-3
        `}
      >
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-14 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-12 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Table Rows Skeleton */}
      <div className={'divide-y divide-border rounded-b-lg border border-t-0 border-border'}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className={'grid grid-cols-[1fr_1fr_auto_1fr_auto] items-center gap-4 px-4 py-3'}
            key={i}
          >
            <div className={'h-6 w-24 animate-pulse rounded-full bg-muted'} />
            <div className={'h-5 w-32 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-5 w-20 animate-pulse rounded-full bg-muted'} />
            <div className={'h-5 w-28 animate-pulse rounded-sm bg-muted'} />
            <div className={'flex justify-end gap-1'}>
              <div className={'size-8 animate-pulse rounded-sm bg-muted'} />
              <div className={'size-8 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditApiKeyDialogWrapper({ existingKey, onClose }: EditApiKeyDialogWrapperProps) {
  // useState hooks
  const [isVisible, setIsVisible] = useState(true);

  // Event handlers
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsVisible(false);
      onClose();
    }
  };

  // Derived values
  const _shouldRender = isVisible;

  if (!_shouldRender) {
    return null;
  }

  // Render dialog with an invisible trigger that auto-clicks
  return (
    <ApiKeyDialogAutoOpen
      existingKey={existingKey}
      mode={'edit'}
      onOpenChange={handleOpenChange}
    />
  );
}
