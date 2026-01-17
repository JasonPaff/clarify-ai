import "server-only";
import { $path } from "next-typesafe-url";
import { withParamValidation } from "next-typesafe-url/app/hoc";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import {
  PageProps,
  Route,
} from "@/app/(app)/projects/[projectId]/(projectId)/route-type";

type ProjectPageProps = PageProps;

async function ProjectPage({
  routeParams,
}: ProjectPageProps): Promise<ReactNode> {
  const { projectId } = await routeParams;

  redirect(
    $path({
      route: "/projects/[projectId]",
      routeParams: { projectId },
    })
  );
}

export default withParamValidation(ProjectPage, Route);
