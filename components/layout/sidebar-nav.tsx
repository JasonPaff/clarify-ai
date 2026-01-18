'use client';

import { Folder, HelpCircle, type LucideIcon, Settings } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useSidebar } from './sidebar-context';
import { SidebarFavorites } from './sidebar-favorites';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const mainNavItems: Array<NavItem> = [{ href: $path({ route: '/projects' }), icon: Folder, label: 'Projects' }];

const bottomNavItems: Array<NavItem> = [
  { href: $path({ route: '/settings' }), icon: Settings, label: 'Settings' },
  { href: $path({ route: '/help' }), icon: HelpCircle, label: 'Help' },
];

interface NavItemLinkProps {
  active: boolean;
  collapsed: boolean;
  item: NavItem;
}

export function SidebarNav() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isActive = (href: string) => {
    if (href === $path({ route: '/projects' })) {
      return pathname === $path({ route: '/projects' }) || pathname.startsWith($path({ route: '/projects' }));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className={'flex h-full flex-col justify-between'}>
      {/* Top Navigation */}
      <div>
        {/* Main Nav Items */}
        <ul className={'space-y-1'}>
          {mainNavItems.map((item) => (
            <li key={item.href}>
              <NavItemLink active={isActive(item.href)} collapsed={collapsed} item={item} />
            </li>
          ))}
        </ul>

        {/* Favorites Section */}
        <SidebarFavorites />
      </div>

      <ul className={'space-y-1'}>
        {bottomNavItems.map((item) => (
          <li key={item.href}>
            <NavItemLink active={isActive(item.href)} collapsed={collapsed} item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItemLink({ active, collapsed, item }: NavItemLinkProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      className={cn(
        `
          flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium
          transition-colors outline-none
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
        `,
        active && 'bg-accent text-accent-foreground',
        !active &&
          `
            text-muted-foreground
            hover:bg-muted hover:text-foreground
          `,
        collapsed && 'w-14 justify-center px-0'
      )}
      href={item.href}
    >
      <Icon className={'size-4 shrink-0'} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} side={'right'}>
        {linkContent}
      </Tooltip>
    );
  }

  return linkContent;
}
