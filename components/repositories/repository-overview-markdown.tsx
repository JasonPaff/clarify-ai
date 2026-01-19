'use client';

import { cn } from '@/lib/utils';

type RepositoryOverviewMarkdownProps = ClassName & {
  content: string;
  isStreaming?: boolean;
};

/**
 * Simple markdown text renderer for repository overview content.
 * Renders text with basic styling - for plain text display without markdown parsing.
 */
export const RepositoryOverviewMarkdown = ({
  className,
  content,
  isStreaming = false,
}: RepositoryOverviewMarkdownProps) => {
  if (!content && !isStreaming) {
    return null;
  }

  return (
    <div className={cn('max-w-none text-sm text-foreground', className)}>
      <div className={'leading-relaxed wrap-break-word whitespace-pre-wrap'}>
        {content}
        {isStreaming && <span className={'ml-0.5 animate-pulse'}>|</span>}
      </div>
    </div>
  );
};
