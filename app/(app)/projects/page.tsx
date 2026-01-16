"use client";

import { FolderPlus, Plus } from "lucide-react";
import { Fragment } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectsPage() {
  // This will be replaced with actual projects data
  const hasProjects = false;

  return (
    <Fragment>
      <PageHeader
        action={
          <Button>
            <Plus className={"size-4"} />
            New Project
          </Button>
        }
        description={"Manage your feature planning projects"}
        title={"Projects"}
      />

      {hasProjects ? (
        <div
          className={`
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          `}
        >
          {/* Project cards will go here */}
        </div>
      ) : (
        <EmptyState
          action={
            <Button>
              <Plus className={"size-4"} />
              Create your first project
            </Button>
          }
          description={
            "Projects help you organize feature requests and implementation plans for your applications."
          }
          icon={<FolderPlus className={"size-6"} />}
          title={"No projects yet"}
        />
      )}
    </Fragment>
  );
}
