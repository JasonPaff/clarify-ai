/* eslint-disable better-tailwindcss/no-unknown-classes */
"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = ClassName<{
  action?: ReactNode;
  description?: string;
  title: string;
}>;

export function PageHeader({
  action,
  className,
  description,
  title,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex items-start justify-between", className)}>
      <div>
        <h1 className={"text-2xl font-semibold tracking-tight"}>{title}</h1>
        {description && (
          <p className={"mt-1 text-sm text-muted-foreground"}>{description}</p>
        )}
      </div>
      {action && <div className={"no-drag"}>{action}</div>}
    </header>
  );
}
