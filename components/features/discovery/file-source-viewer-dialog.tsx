'use client';

import type { ReactNode } from 'react';

import { AlertCircle, CheckIcon, Code, CopyIcon, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DiscoveredFileEntry } from '@/lib/validations/discovery';

import { Button } from '@/components/ui/button';
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
import { useElectronFs } from '@/hooks/useElectron';

import { FileSourceViewer } from './file-source-viewer';
import { SnippetNavigator } from './snippet-navigator';

interface FileSourceViewerDialogProps {
  /** Trigger element (defaults to a code icon button) */
  children?: ReactNode;
  /** The discovered file entry to view */
  discoveredFile: DiscoveredFileEntry;
  /** Called when the dialog opens or closes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Controlled open state */
  open?: boolean;
  /** Base path of the repository containing this file */
  repositoryPath: string;
}

/**
 * Dialog for viewing the full source code of a discovered file.
 * Shows syntax highlighting and highlights AI-discovered code snippets.
 */
export const FileSourceViewerDialog = ({
  children,
  discoveredFile,
  onOpenChange,
  open: controlledOpen,
  repositoryPath,
}: FileSourceViewerDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [content, setContent] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const { isElectron, readFile } = useElectronFs();
  const viewerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Construct full file path
  const fullPath = useMemo(() => {
    // Normalize path separators
    const normalizedRepoPath = repositoryPath.replace(/\\/g, '/').replace(/\/$/, '');
    const normalizedFilePath = discoveredFile.path.replace(/\\/g, '/').replace(/^\//, '');
    return `${normalizedRepoPath}/${normalizedFilePath}`;
  }, [repositoryPath, discoveredFile.path]);

  // Filter snippets that have line numbers (for navigation)
  const navigableSnippets = useMemo(() => {
    if (!discoveredFile.snippets) return [];
    return discoveredFile.snippets.filter(
      (snippet) => snippet.startLine !== undefined && snippet.endLine !== undefined
    );
  }, [discoveredFile.snippets]);

  const hasSnippets = navigableSnippets.length > 0;

  // Load file content when dialog opens
  useEffect(() => {
    if (!isOpen || !isElectron) return;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      setContent(null);
      setActiveSnippetIndex(0);

      const result = await readFile(fullPath);

      if (result.success && result.content !== undefined) {
        setContent(result.content);
      } else {
        setError(result.error ?? 'Failed to read file');
      }

      setIsLoading(false);
    };

    void loadFile();
  }, [isOpen, isElectron, readFile, fullPath]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }

      if (!nextOpen) {
        // Reset state when closing
        setContent(null);
        setError(null);
        setActiveSnippetIndex(0);
        setIsCopied(false);
      }
    },
    [isControlled, onOpenChange]
  );

  const handleCopyToClipboard = useCallback(async () => {
    if (!content || typeof window === 'undefined' || !navigator?.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Silently fail
    }
  }, [content]);

  const handleSnippetNavigate = useCallback(
    (index: number) => {
      setActiveSnippetIndex(index);

      // Scroll to the highlighted line
      const snippet = navigableSnippets[index];
      if (snippet?.startLine !== undefined && viewerRef.current) {
        // Find the highlighted line element
        const highlightedLines = viewerRef.current.querySelectorAll('.highlighted-line');

        // Calculate the offset based on previous snippets' line counts
        let currentLineCount = 0;
        for (let i = 0; i < index; i++) {
          const prevSnippet = navigableSnippets[i];
          if (prevSnippet?.startLine !== undefined && prevSnippet.endLine !== undefined) {
            currentLineCount += prevSnippet.endLine - prevSnippet.startLine + 1;
          }
        }

        const targetElement = highlightedLines[currentLineCount];
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [navigableSnippets]
  );

  // Extract filename for display
  const fileName = discoveredFile.path.split(/[/\\]/).pop() ?? discoveredFile.path;

  // Derived display conditions
  const isEmptyFile = content === '' && !isLoading && !error;
  const hasFileContent = content !== null && content.length > 0;

  const triggerContent = children ?? (
    <Button aria-label={'View source'} size={'icon-sm'} variant={'ghost'}>
      <Code className={'size-4'} />
    </Button>
  );

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger>{triggerContent}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden p-6'}>
          {/* Close Button */}
          <div className={'relative shrink-0'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Dialog Header */}
          <div className={'shrink-0'}>
            <DialogTitle className={'flex items-center gap-2'}>
              <Code aria-hidden={'true'} className={'size-5'} />
              {fileName}
            </DialogTitle>
            <DialogDescription className={'truncate'}>{discoveredFile.path}</DialogDescription>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={'mt-6 flex flex-1 items-center justify-center'}>
              <div className={'flex flex-col items-center gap-3'}>
                <Loader2 className={'size-8 animate-spin text-accent'} />
                <p className={'text-sm text-muted-foreground'}>Loading file...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={'mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4'}>
              <div className={'flex items-center gap-2'}>
                <AlertCircle className={'size-4 text-destructive'} />
                <div>
                  <p className={'text-sm font-medium text-destructive'}>Failed to load file</p>
                  <p className={'text-xs text-destructive/80'}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty Content State */}
          {isEmptyFile && (
            <div className={'mt-6 flex flex-1 items-center justify-center'}>
              <div className={'text-center'}>
                <Code className={'mx-auto size-8 text-muted-foreground/50'} />
                <p className={'mt-2 text-sm font-medium text-muted-foreground'}>This file is empty</p>
              </div>
            </div>
          )}

          {/* Content */}
          {hasFileContent && (
            <div className={'mt-6 flex min-h-0 flex-1 flex-col gap-4'}>
              {/* Snippet Navigator */}
              {hasSnippets && (
                <div className={'shrink-0'}>
                  <SnippetNavigator
                    activeIndex={activeSnippetIndex}
                    onNavigate={handleSnippetNavigate}
                    snippets={navigableSnippets}
                  />
                </div>
              )}

              {/* File Content */}
              <div className={'relative min-h-0 flex-1'} ref={viewerRef}>
                <FileSourceViewer
                  className={'h-full'}
                  content={content}
                  filePath={discoveredFile.path}
                  snippets={discoveredFile.snippets}
                />

                {/* Copy Button */}
                <div className={'absolute top-2 right-6'}>
                  <Button
                    aria-label={isCopied ? 'Copied!' : 'Copy to clipboard'}
                    onClick={handleCopyToClipboard}
                    size={'icon-sm'}
                    variant={'ghost'}
                  >
                    {isCopied ? <CheckIcon className={'size-4'} /> : <CopyIcon className={'size-4'} />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className={'mt-4 flex shrink-0 justify-end border-t border-border pt-4'}>
            <Button onClick={() => handleOpenChange(false)} variant={'outline'}>
              Close
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
