import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Debug and monitor AI operations in Clarify AI',
  title: 'AI DevTools - Clarify AI',
};

type DevtoolsLayoutProps = RequiredChildren;

/**
 * Layout for the DevTools window.
 * This is a nested layout that inherits providers from the root layout.
 * It only provides devtools-specific metadata.
 */
export default function DevtoolsLayout({ children }: DevtoolsLayoutProps) {
  return children;
}
