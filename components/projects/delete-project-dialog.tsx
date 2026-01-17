"use client";

import type { ReactNode } from "react";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { $path } from "next-typesafe-url";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Project } from "@/db/schema/projects.schema";

import { Button } from "@/components/ui/button";
import { useDeleteProject } from "@/hooks/queries/use-projects";
import { cn } from "@/lib/utils";

interface DeleteProjectDialogProps {
  children: ReactNode;
  project: Project;
}

export function DeleteProjectDialog({
  children,
  project,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    await deleteProject.mutateAsync(project.id);
    setOpen(false);
    router.push($path({ route: "/projects" }));
  };

  return (
    <AlertDialog.Root onOpenChange={setOpen} open={open}>
      <AlertDialog.Trigger render={<span className={"inline-flex"} />}>
        {children}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            "data-ending-style:opacity-0",
            "data-starting-style:opacity-0"
          )}
        />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-1/2 rounded-lg border border-border",
            "bg-background p-6 shadow-lg outline-none transition-all duration-200",
            "data-ending-style:scale-95 data-ending-style:opacity-0",
            "data-starting-style:scale-95 data-starting-style:opacity-0"
          )}
        >
          <AlertDialog.Title className={"text-lg font-semibold text-foreground"}>
            Delete Project
          </AlertDialog.Title>
          <AlertDialog.Description className={"mt-2 text-sm text-muted-foreground"}>
            Are you sure you want to delete{" "}
            <span className={"font-semibold text-foreground"}>
              {project.name}
            </span>
            ?
          </AlertDialog.Description>
          <p className={"mt-4 text-sm text-destructive"}>
            This action cannot be undone. All associated repositories and
            features will also be permanently deleted.
          </p>
          <div className={"mt-6 flex justify-end gap-3"}>
            <AlertDialog.Close
              render={<Button variant={"outline"} />}
            >
              Cancel
            </AlertDialog.Close>
            <Button
              disabled={deleteProject.isPending}
              onClick={handleDelete}
              variant={"destructive"}
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
