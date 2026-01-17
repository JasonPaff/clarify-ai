/* eslint-disable better-tailwindcss/no-unknown-classes */
'use client';

import { cn } from '@/lib/utils';

type ContentAreaProps = RequiredChildren<ClassName>;

export function ContentArea({ children, className }: ContentAreaProps) {
  return (
    <main className={cn('flex-1 overflow-y-auto', className)}>
      {/* Drag region for Electron - allows window dragging at top */}
      <div className={'drag-region h-3'} />
      <div className={'px-6 pb-6'}>{children}</div>
    </main>
  );
}
