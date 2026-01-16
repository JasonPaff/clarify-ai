"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";

type ProjectLayoutProps = RequiredChildren<{
  params: Promise<{ projectId: string }>;
}>;

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = use(params);

  // This will be replaced with actual project data fetching
  const projectName = `Project ${projectId}`;

  return (
    <div>
      <div className={"flex items-center gap-3"}>
        <Tooltip content={"Back to projects"} side={"right"}>
          <Link href={"/projects"}>
            <IconButton>
              <ArrowLeft className={"size-4"} />
            </IconButton>
          </Link>
        </Tooltip>
        <PageHeader className={"mb-0 flex-1"} title={projectName} />
      </div>

      <div className={"mt-4"}>
        <ProjectTabs projectId={projectId} />
      </div>

      <div className={"mt-6"}>{children}</div>
    </div>
  );
}
