"use client";

import { ChevronRight, Folder } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProjectCardProps {
  description?: string;
  featureCount?: number;
  id: string;
  name: string;
}

export function ProjectCard({
  description,
  featureCount = 0,
  id,
  name,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <Card
        className={`
          cursor-pointer transition-shadow
          hover:shadow-md
        `}
      >
        <CardHeader className={"pb-2"}>
          <div className={"flex items-start justify-between"}>
            <div
              className={`
                flex size-10 items-center justify-center rounded-lg bg-muted
              `}
            >
              <Folder className={"size-5 text-muted-foreground"} />
            </div>
            <ChevronRight className={"size-4 text-muted-foreground"} />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className={"mb-1 text-base"}>{name}</CardTitle>
          {description && (
            <CardDescription className={"line-clamp-2 text-xs"}>
              {description}
            </CardDescription>
          )}
          <p className={"mt-2 text-xs text-muted-foreground"}>
            {featureCount} {featureCount === 1 ? "feature" : "features"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
