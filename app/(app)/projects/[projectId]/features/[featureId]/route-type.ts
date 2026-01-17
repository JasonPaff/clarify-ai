import type { DynamicRoute, InferPagePropsType } from "next-typesafe-url";

import { z } from "zod";

export const Route = {
  routeParams: z.object({
    featureId: z.number(),
    projectId: z.number(),
  }),
} satisfies DynamicRoute;

export type PageProps = InferPagePropsType<RouteType>;
export type RouteType = typeof Route;
