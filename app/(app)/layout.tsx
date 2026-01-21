'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { ContentArea } from '@/components/layout/content-area';
import { WorkflowProvider } from '@/components/providers/workflow-provider';
import { useElectronDb } from '@/hooks/useElectron';
import { projectKeys } from '@/lib/queries/projects';

type AppLayoutProps = RequiredChildren;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <WorkflowProvider>
      <AppShell>
        <PrefetchCriticalData />
        <ContentArea>{children}</ContentArea>
      </AppShell>
    </WorkflowProvider>
  );
}

function PrefetchCriticalData() {
  const queryClient = useQueryClient();
  const { isElectron, projects } = useElectronDb();

  useEffect(() => {
    if (!isElectron) return;

    void queryClient.prefetchQuery({
      ...projectKeys.list(),
      queryFn: () => projects.getAll(),
    });
  }, [queryClient, isElectron, projects]);

  return null;
}
