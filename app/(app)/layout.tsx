"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ContentArea } from "@/components/layout/content-area";
import { useElectronDb } from "@/hooks/useElectron";
import { projectKeys } from "@/lib/queries/projects";

type AppLayoutProps = RequiredChildren;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell>
      <PrefetchCriticalData />
      <ContentArea>{children}</ContentArea>
    </AppShell>
  );
}

function PrefetchCriticalData() {
  const queryClient = useQueryClient();
  const { isElectron, projects } = useElectronDb();

  useEffect(() => {
    if (!isElectron) return;

    void queryClient.prefetchQuery({
      queryFn: () => projects.getAll(),
      queryKey: projectKeys.lists(),
    });
  }, [queryClient, isElectron, projects]);

  return null;
}
