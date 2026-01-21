'use client';

import { $path } from 'next-typesafe-url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTabsProps {
  projectId: number;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: $path({
        route: '/projects/[projectId]/features',
        routeParams: { projectId },
      }),
      label: 'Features',
      value: 'features',
    },
    {
      href: $path({
        route: '/projects/[projectId]/repositories',
        routeParams: { projectId },
      }),
      label: 'Repositories',
      value: 'repositories',
    },
    {
      href: $path({
        route: '/projects/[projectId]/settings',
        routeParams: { projectId },
      }),
      label: 'Settings',
      value: 'settings',
    },
  ] as const;

  // Determine active tab from pathname
  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href))?.value ?? 'features';

  return (
    <TabsRoot value={activeTab}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            nativeButton={false}
            render={<Link href={tab.href} />}
            value={tab.value}
          >
            {tab.label}
          </TabsTrigger>
        ))}
        <TabsIndicator />
      </TabsList>
    </TabsRoot>
  );
}
