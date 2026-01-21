'use client';

import type { ChangeEvent, ComponentPropsWithRef, KeyboardEvent } from 'react';

import { Check, Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import type {
  DiscoveredFileEntry,
  DiscoveryCodeSnippet,
  DiscoveryFileAction,
  DiscoveryRiskLevel,
} from '@/lib/validations/discovery';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FileCardEditorProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** The discovered file entry to edit */
  file: DiscoveredFileEntry;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Callback when the file data changes */
  onChange: (updatedFile: DiscoveredFileEntry) => void;
  /** Callback when save is clicked */
  onSave: () => void;
}

/** Available action options for the select dropdown */
const ACTION_OPTIONS: Array<{ label: string; value: DiscoveryFileAction }> = [
  { label: 'Create', value: 'create' },
  { label: 'Delete', value: 'delete' },
  { label: 'Modify', value: 'modify' },
  { label: 'Review', value: 'review' },
];

/** Available risk level options for the select dropdown */
const RISK_OPTIONS: Array<{ label: string; value: DiscoveryRiskLevel }> = [
  { label: 'High', value: 'high' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
];

/**
 * Editor component for modifying discovered file entries.
 * Provides editable fields for action, risk level, reason, dependencies, and code snippets.
 */
export const FileCardEditor = ({ className, file, onCancel, onChange, onSave, ref, ...props }: FileCardEditorProps) => {
  const [newDependency, setNewDependency] = useState('');

  // Extract filename and directory from path
  const fileName = file.path.split('/').pop() ?? file.path;
  const directoryPath = file.path.slice(0, file.path.lastIndexOf('/')) || '.';

  // Derived conditions
  const hasDependencies = file.dependencies && file.dependencies.length > 0;
  const hasSnippets = file.snippets && file.snippets.length > 0;

  /**
   * Handle action selection change
   */
  const handleActionChange = useCallback(
    (value: DiscoveryFileAction | null) => {
      if (value === null) return;
      onChange({ ...file, action: value, isEdited: true });
    },
    [file, onChange]
  );

  /**
   * Handle risk level selection change
   */
  const handleRiskChange = useCallback(
    (value: DiscoveryRiskLevel | null) => {
      if (value === null) return;
      onChange({ ...file, isEdited: true, risk: value });
    },
    [file, onChange]
  );

  /**
   * Handle reason text change
   */
  const handleReasonChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...file, isEdited: true, reason: event.target.value });
    },
    [file, onChange]
  );

  /**
   * Handle adding a new dependency
   */
  const handleAddDependency = useCallback(() => {
    if (!newDependency.trim()) return;

    const currentDependencies = file.dependencies ?? [];
    const updatedDependencies = [...currentDependencies, newDependency.trim()];
    onChange({ ...file, dependencies: updatedDependencies, isEdited: true });
    setNewDependency('');
  }, [file, newDependency, onChange]);

  /**
   * Handle removing a dependency
   */
  const handleRemoveDependency = useCallback(
    (dependencyToRemove: string) => {
      const currentDependencies = file.dependencies ?? [];
      const updatedDependencies = currentDependencies.filter((dep) => dep !== dependencyToRemove);
      onChange({ ...file, dependencies: updatedDependencies, isEdited: true });
    },
    [file, onChange]
  );

  /**
   * Handle key press in dependency input (Enter to add)
   */
  const handleDependencyKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddDependency();
      }
    },
    [handleAddDependency]
  );

  return (
    <div
      className={cn(
        'rounded-md border border-accent bg-background p-4',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-0',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header Section */}
      <div className={'mb-4 border-b border-border pb-3'}>
        <h3 className={'font-medium text-foreground'}>{fileName}</h3>
        <span className={'text-xs text-muted-foreground'}>{directoryPath}</span>
      </div>

      {/* Form Fields */}
      <div className={'space-y-4'}>
        {/* Action and Risk Row */}
        <div className={'grid grid-cols-2 gap-4'}>
          {/* Action Select */}
          <div>
            <label className={'mb-1.5 block text-xs font-medium text-foreground'}>Action</label>
            <SelectRoot onValueChange={handleActionChange} value={file.action}>
              <SelectTrigger className={'w-full'}>
                <SelectValue placeholder={'Select action'} />
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
          </div>

          {/* Risk Level Select */}
          <div>
            <label className={'mb-1.5 block text-xs font-medium text-foreground'}>Risk Level</label>
            <SelectRoot onValueChange={handleRiskChange} value={file.risk}>
              <SelectTrigger className={'w-full'}>
                <SelectValue placeholder={'Select risk'} />
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      {RISK_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
          </div>
        </div>

        {/* Reason Textarea */}
        <div>
          <label className={'mb-1.5 block text-xs font-medium text-foreground'}>Reason</label>
          <Textarea
            onChange={handleReasonChange}
            placeholder={'Explain why this file is relevant...'}
            rows={3}
            value={file.reason}
          />
        </div>

        {/* Dependencies Section */}
        <div>
          <label className={'mb-1.5 block text-xs font-medium text-foreground'}>Dependencies</label>
          {/* Dependencies List */}
          {hasDependencies && (
            <ul className={'mb-2 space-y-1'}>
              {file.dependencies?.map((dep) => (
                <li className={'flex items-center justify-between rounded-md bg-muted/50 px-2 py-1'} key={dep}>
                  <span className={'truncate text-xs text-muted-foreground'}>{dep}</span>
                  <Button onClick={() => handleRemoveDependency(dep)} size={'icon-sm'} variant={'ghost'}>
                    <X aria-hidden={'true'} className={'size-3'} />
                    <span className={'sr-only'}>Remove {dep}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {/* Add Dependency Input */}
          <div className={'flex gap-2'}>
            <Input
              onChange={(e) => setNewDependency(e.target.value)}
              onKeyDown={handleDependencyKeyDown}
              placeholder={'Add dependency path...'}
              size={'sm'}
              value={newDependency}
            />
            <Button onClick={handleAddDependency} size={'sm'} variant={'outline'}>
              <Plus aria-hidden={'true'} className={'size-4'} />
              Add
            </Button>
          </div>
        </div>

        {/* Code Snippets Section (Read-Only Display) */}
        {hasSnippets && (
          <div>
            <label className={'mb-1.5 block text-xs font-medium text-foreground'}>Code Snippets</label>
            <div className={'space-y-2'}>
              {file.snippets?.map((snippet: DiscoveryCodeSnippet, index: number) => {
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

        {/* AI Reasoning Section (Read-Only) */}
        {file.confidence !== undefined && (
          <div className={'rounded-md bg-muted/30 p-3'}>
            <label className={'mb-1.5 block text-xs font-medium text-foreground'}>AI Confidence</label>
            <div className={'flex items-center gap-2'}>
              <div className={'h-2 flex-1 rounded-full bg-muted'}>
                <div className={'h-full rounded-full bg-accent'} style={{ width: `${file.confidence}%` }} />
              </div>
              <span className={'text-xs text-muted-foreground'}>{file.confidence}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={'flex justify-end gap-2 border-t border-border pt-4'}>
          <Button onClick={onCancel} variant={'outline'}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Check aria-hidden={'true'} className={'mr-1 size-4'} />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
