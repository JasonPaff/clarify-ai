"use client";

import { AlertTriangle, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProjectSettingsPage() {
  return (
    <div className={"space-y-6"}>
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className={"flex items-center gap-3"}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg bg-muted
              `}
            >
              <Pencil className={"size-5 text-muted-foreground"} />
            </div>
            <div>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic project information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              rounded-lg border border-dashed border-border p-8 text-center
              text-sm text-muted-foreground
            `}
          >
            Project name and description editing coming soon
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className={"border-destructive/50"}>
        <CardHeader>
          <div className={"flex items-center gap-3"}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg
                bg-destructive/10
              `}
            >
              <AlertTriangle className={"size-5 text-destructive"} />
            </div>
            <div>
              <CardTitle className={"text-destructive"}>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this project
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              flex items-center justify-between rounded-lg border border-border
              p-4
            `}
          >
            <div>
              <p className={"text-sm font-medium"}>Delete this project</p>
              <p className={"text-xs text-muted-foreground"}>
                Once deleted, this project and all its data cannot be recovered.
              </p>
            </div>
            <Button size={"sm"} variant={"destructive"}>
              <Trash2 className={"size-4"} />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
