'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Children, isValidElement, useMemo } from 'react';
import { Streamdown } from 'streamdown';

import { cn } from '@/lib/utils';

type RepositoryOverviewMarkdownProps = ClassName & {
  content: string;
  isStreaming?: boolean;
};

type SafeParagraphProps = ComponentPropsWithRef<'p'>;

/**
 * Check if any children contain block-level elements that cannot be inside <p>
 */
function hasBlockChildren(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    const type = child.type;
    // Check for block-level element types
    if (typeof type === 'string') {
      const blockElements = ['div', 'pre', 'ul', 'ol', 'table', 'blockquote', 'figure', 'hr', 'form', 'fieldset'];
      return blockElements.includes(type);
    }
    // Check for components that render block elements (by data attributes or class names)
    const props = child.props as Record<string, unknown> | undefined;
    if (props) {
      const dataStreamdown = props['data-streamdown'];
      if (
        typeof dataStreamdown === 'string' &&
        (dataStreamdown.includes('code-block') || dataStreamdown.includes('list'))
      ) {
        return true;
      }
      // Recursively check children
      if (props.children) {
        return hasBlockChildren(props.children as ReactNode);
      }
    }
    return false;
  });
}

/**
 * Custom paragraph component that uses <div> when children contain block-level elements.
 * This prevents React hydration errors like "<div> cannot be a descendant of <p>".
 */
function SafeParagraph({ children, ...props }: SafeParagraphProps) {
  const useDiv = hasBlockChildren(children);

  if (useDiv) {
    return <div {...props}>{children}</div>;
  }

  return <p {...props}>{children}</p>;
}

/**
 * Markdown renderer for repository overview content.
 * Uses Streamdown for proper markdown parsing and rendering.
 */
export const RepositoryOverviewMarkdown = ({
  className,
  content,
  isStreaming = false,
}: RepositoryOverviewMarkdownProps) => {
  // Custom components to fix hydration errors with nested block elements
  const components = useMemo(
    () => ({
      p: SafeParagraph,
    }),
    []
  );

  if (!content && !isStreaming) {
    return null;
  }

  return (
    <div className={cn('max-w-none text-sm text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
      <Streamdown components={components}>{content}</Streamdown>
      {isStreaming && <span className={'ml-0.5 animate-pulse'}>|</span>}
    </div>
  );
};
