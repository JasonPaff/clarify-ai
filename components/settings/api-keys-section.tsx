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
  const [deletingKey, setDeletingKey] = useState<ApiKeyInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const apiKeysQuery = useApiKeys();
  const encryptionQuery = useEncryptionAvailable();

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

  const _isLoading = apiKeysQuery.isLoading || encryptionQuery.isLoading;
  const _isEncryptionAvailable = encryptionQuery.data === true;
  const _apiKeys = apiKeysQuery.data ?? [];

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
                Secure storage is not available on this system. API keys will be stored in plain text. This may be a
                security risk.
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
        {!_isLoading && !apiKeysQuery.isError && <ApiKeysContent apiKeys={_apiKeys} onDelete={handleDelete} />}

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

// Separate component for API keys content with edit functionality
interface ApiKeysContentProps {
  apiKeys: Array<ApiKeyInfo>;
  onDelete: (provider: ApiKeyProvider) => void;
}

function ApiKeysContent({ apiKeys, onDelete }: ApiKeysContentProps) {
  const [editingKey, setEditingKey] = useState<ApiKeyInfo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (provider: ApiKeyProvider) => {
    const keyEntry = apiKeys.find((key) => key.provider === provider);
    if (keyEntry) {
      setEditingKey(keyEntry);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditDialogOpenChange = (isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
    if (!isOpen) {
      setEditingKey(null);
    }
  };

  return (
    <Fragment>
      {/* API Keys Table */}
      <ApiKeyTable apiKeys={apiKeys} onDelete={onDelete} onEdit={handleEdit} />

      {/* Edit Dialog (controlled) */}
      {editingKey && (
        <ApiKeyDialog
          existingKey={editingKey}
          mode={'edit'}
          onOpenChange={handleEditDialogOpenChange}
          open={isEditDialogOpen}
        />
      )}
    </Fragment>
  );
}

// Loading skeleton for categorized layout
function ApiKeysSkeleton() {
  return (
    <div className={'space-y-6'}>
      {/* Category Skeletons - 4 categories */}
      {Array.from({ length: 4 }).map((_, categoryIndex) => (
        <div className={'space-y-3'} key={categoryIndex}>
          {/* Category Header Skeleton */}
          <div className={'flex items-center gap-2'}>
            <div className={'size-6 animate-pulse rounded-md bg-muted'} />
            <div className={'space-y-1'}>
              <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-48 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>

          {/* Category Table Skeleton */}
          <div className={'overflow-hidden rounded-lg border border-border'}>
            {/* Table Header Skeleton */}
            <div
              className={`
                grid grid-cols-[1fr_minmax(120px,1fr)_auto_minmax(100px,1fr)_auto] gap-4 border-b
                border-border bg-muted/50 px-4 py-2.5
              `}
            >
              <div className={'h-3 w-16 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-20 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-14 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-24 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-14 animate-pulse rounded-sm bg-muted'} />
            </div>

            {/* Table Rows Skeleton - vary count by category position */}
            <div className={'divide-y divide-border'}>
              {Array.from({ length: getSkeletonRowCount(categoryIndex) }).map((_, rowIndex) => (
                <div
                  className={`
                    grid grid-cols-[1fr_minmax(120px,1fr)_auto_minmax(100px,1fr)_auto] items-center
                    gap-4 px-4 py-3
                  `}
                  key={rowIndex}
                >
                  <div className={'h-6 w-24 animate-pulse rounded-full bg-muted'} />
                  <div className={'h-5 w-28 animate-pulse rounded-sm bg-muted'} />
                  <div className={'h-5 w-16 animate-pulse rounded-full bg-muted'} />
                  <div className={'h-5 w-20 animate-pulse rounded-sm bg-muted'} />
                  <div className={'flex justify-end gap-1'}>
                    <div className={'size-8 animate-pulse rounded-sm bg-muted'} />
                    <div className={'size-8 animate-pulse rounded-sm bg-muted'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Status Skeleton */}
          <div className={'h-3 w-28 animate-pulse rounded-sm bg-muted'} />
        </div>
      ))}
    </div>
  );
}

/** Returns the number of skeleton rows based on category index */
function getSkeletonRowCount(categoryIndex: number): number {
  // Match expected provider counts: major=3, emerging=6, enterprise=2, local=1
  const rowCounts = [3, 6, 2, 1];
  return rowCounts[categoryIndex] ?? 2;
}
