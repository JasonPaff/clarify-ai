"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  TabsIndicator,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ProjectTabsProps {
  projectId: string;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: `/projects/${projectId}/features`,
      label: "Features",
      value: "features",
    },
    {
      href: `/projects/${projectId}/repositories`,
      label: "Repositories",
      value: "repositories",
    },
    {
      href: `/projects/${projectId}/settings`,
      label: "Settings",
      value: "settings",
    },
  ] as const;

  // Determine active tab from pathname
  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.href))?.value ?? "features";

  return (
    <TabsRoot value={activeTab}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
        <TabsIndicator />
      </TabsList>
    </TabsRoot>
  );
}
