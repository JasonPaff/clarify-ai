'use client';

import { AiDevtoolsWindow } from '@/components/ai-devtools/ai-devtools-window';

/**
 * DevTools page for the standalone DevTools window.
 * Renders the main AI DevTools window component for viewing
 * and debugging AI operations.
 */
export default function DevtoolsPage() {
  return (
    <main className={'h-screen w-screen overflow-hidden'}>
      <AiDevtoolsWindow />
    </main>
  );
}
