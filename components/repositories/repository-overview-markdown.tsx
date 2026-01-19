'use client';

import { Streamdown } from 'streamdown';

import { cn } from '@/lib/utils';

type RepositoryOverviewMarkdownProps = ClassName & {
  content: string;
  isStreaming?: boolean;
};

/**
 * Markdown renderer for repository overview content.
 * Uses Streamdown for proper markdown parsing and rendering.
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
    <div className={cn('max-w-none text-sm text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
      <Streamdown>{content}</Streamdown>
      {isStreaming && <span className={'ml-0.5 animate-pulse'}>|</span>}
    </div>
  );
};
