'use client';

import { createContext, use, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<null | SidebarContextValue>(null);

type SidebarProviderProps = RequiredChildren;

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);

  const updateCollapsed = useEffectEvent((stored: boolean) => {
    setCollapsed(stored);
  });

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      updateCollapsed(stored === 'true');
    }
  }, []);

  const handleSetCollapsed = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar-collapsed', String(value));
  }, []);

  const toggle = useCallback(() => {
    handleSetCollapsed(!collapsed);
  }, [collapsed, handleSetCollapsed]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ collapsed, setCollapsed: handleSetCollapsed, toggle }),
    [collapsed, handleSetCollapsed, toggle]
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}

export function useSidebar() {
  const context = use(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
