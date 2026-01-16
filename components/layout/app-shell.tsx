"use client";

import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

type AppShellProps = RequiredChildren;

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className={"flex h-screen overflow-hidden bg-background"}>
        <Sidebar />
        {children}
      </div>
    </SidebarProvider>
  );
}
