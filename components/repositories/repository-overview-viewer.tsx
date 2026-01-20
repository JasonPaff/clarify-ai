'use client';

import { Download, Edit2, Eye, RefreshCw } from 'lucide-react';
import { Fragment, useState } from 'react';

import type { RepositoryOverview } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useElectronDialog, useElectronFs } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

import { RepositoryOverviewMarkdown } from './repository-overview-markdown';

type RepositoryOverviewViewerProps = ClassName & {
  onRegenerate: () => void;
  onUpdate: (content: string) => void;
  overview: RepositoryOverview;
  repositoryName: string;
};

/**
 * Component for viewing and editing existing repository overviews.
 * Supports read-only markdown preview, edit mode, regenerate, and export.
 */
export const RepositoryOverviewViewer = ({
  className,
  onRegenerate,
  onUpdate,
  overview,
  repositoryName,
}: RepositoryOverviewViewerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const { saveFile } = useElectronDialog();
  const { writeFile } = useElectronFs();

  // Get the current content (manual edits take precedence over original generated content)
  const currentContent = overview.manualContent ?? overview.content;

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedContent(currentContent);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = () => {
    if (editedContent !== currentContent) {
      onUpdate(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const handleExport = async () => {
    const defaultPath = `${repositoryName}-overview.md`;
    const filePath = await saveFile(defaultPath, [{ extensions: ['md'], name: 'Markdown' }]);

    if (filePath) {
      await writeFile(filePath, currentContent);
    }
  };

  const isManuallyEdited = overview.manualContent !== null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with actions */}
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-2'}>
          {isManuallyEdited && (
            <span
              className={`
                rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400
              `}
            >
              Manually Edited
            </span>
          )}
        </div>
        <div className={'flex gap-2'}>
          <Button onClick={handleEditToggle} size={'sm'} variant={'outline'}>
            {isEditing ? (
              <Fragment>
                <Eye className={'mr-2 size-4'} />
                Preview
              </Fragment>
            ) : (
              <Fragment>
                <Edit2 className={'mr-2 size-4'} />
                Edit
              </Fragment>
            )}
          </Button>
          <Button onClick={handleExport} size={'sm'} variant={'outline'}>
            <Download className={'mr-2 size-4'} />
            Export
          </Button>
          <Button onClick={onRegenerate} size={'sm'} variant={'outline'}>
            <RefreshCw className={'mr-2 size-4'} />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className={'max-h-96 overflow-y-auto rounded-md border border-border bg-muted/30 p-4'}>
        {isEditing ? (
          <Textarea
            className={'min-h-80 resize-y font-mono text-sm'}
            onChange={(e) => setEditedContent(e.target.value)}
            value={editedContent}
          />
        ) : (
          <RepositoryOverviewMarkdown content={currentContent} />
        )}
      </div>

      {/* Edit mode actions */}
      {isEditing && (
        <div className={'flex justify-end gap-2'}>
          <Button onClick={handleCancelEdit} variant={'outline'}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>Save Changes</Button>
        </div>
      )}

      {/* Metadata */}
      <div className={'flex flex-wrap gap-4 text-xs text-muted-foreground'}>
        {overview.generatedAt && <span>Generated: {new Date(overview.generatedAt).toLocaleDateString()}</span>}
        {overview.modelId && (
          <span>{overview.modelId === 'imported' ? 'Source: Imported' : `Model: ${overview.modelId}`}</span>
        )}
        {overview.lastEditedAt && <span>Last edited: {new Date(overview.lastEditedAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};
