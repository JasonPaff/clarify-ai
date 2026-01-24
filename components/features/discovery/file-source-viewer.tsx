'use client';

import { useMemo } from 'react';

import type { DiscoveryCodeSnippet } from '@/lib/validations/discovery';

import { CodeBlock, type HighlightRange } from '@/components/ui/ai/code-block';
import { cn, getLanguageFromPath } from '@/lib/utils';

interface FileSourceViewerProps {
  className?: string;
  /** Full file content to display */
  content: string;
  /** File path (used for language detection) */
  filePath: string;
  /** Code snippets to highlight within the file */
  snippets?: Array<DiscoveryCodeSnippet>;
}

/**
 * Displays file source code with syntax highlighting and optional snippet highlighting.
 * Converts discovery code snippets to highlight ranges for the CodeBlock component.
 */
export const FileSourceViewer = ({ className, content, filePath, snippets }: FileSourceViewerProps) => {
  // Default to 'markdown' for unknown file types as it renders plain text well
  const language = getLanguageFromPath(filePath) ?? 'markdown';

  // Convert snippets with line numbers to highlight ranges
  const highlightRanges = useMemo<Array<HighlightRange>>(() => {
    if (!snippets) return [];

    return snippets
      .filter((snippet) => snippet.startLine !== undefined && snippet.endLine !== undefined)
      .map((snippet) => ({
        endLine: snippet.endLine!,
        startLine: snippet.startLine!,
      }));
  }, [snippets]);

  return (
    <div className={cn('max-h-[60vh] overflow-auto', className)}>
      <CodeBlock code={content} highlightRanges={highlightRanges} language={language} showLineNumbers />
    </div>
  );
};
