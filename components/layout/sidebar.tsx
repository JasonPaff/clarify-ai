/* eslint-disable better-tailwindcss/no-unknown-classes */
"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        `
          flex h-screen flex-col border-r border-sidebar-border bg-sidebar-bg
          transition-[width] duration-200 ease-in-out
        `,
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header with drag region for Electron */}
      <div
        className={"drag-region flex h-12 items-center justify-between px-3"}
      >
        {!collapsed && (
          <span className={"no-drag text-sm font-semibold"}>Clarify AI</span>
        )}
        <Tooltip
          content={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          side={"right"}
        >
          <IconButton className={"no-drag"} onClick={toggle}>
            {collapsed ? (
              <PanelLeftOpen className={"size-4"} />
            ) : (
              <PanelLeftClose className={"size-4"} />
            )}
          </IconButton>
        </Tooltip>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className={"flex-1 overflow-y-auto p-2"}>
        <SidebarNav />
      </nav>
    </aside>
  );
}
