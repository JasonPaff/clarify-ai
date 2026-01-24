'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { ContentArea } from '@/components/layout/content-area';
import { BackgroundOverviewGenerationProvider } from '@/components/providers/background-overview-generation-provider';
import { WorkflowProvider } from '@/components/providers/workflow-provider';
import { useElectronDb } from '@/hooks/useElectron';
import { projectKeys } from '@/lib/queries/projects';

type AppLayoutProps = RequiredChildren;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <BackgroundOverviewGenerationProvider>
      <WorkflowProvider>
        <AppShell>
          <PrefetchCriticalData />
          <ContentArea>{children}</ContentArea>
        </AppShell>
      </WorkflowProvider>
    </BackgroundOverviewGenerationProvider>
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
