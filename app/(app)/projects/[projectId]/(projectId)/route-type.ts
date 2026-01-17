import {
  DynamicLayout,
  DynamicRoute,
  InferLayoutPropsType,
  InferPagePropsType,
} from "next-typesafe-url";
import { z } from "zod";

export const Route = {
  routeParams: z.object({
    projectId: z.number(),
  }),
} satisfies DynamicRoute;

export const Layout = {
  routeParams: z.object({
    projectId: z.number(),
  }),
} satisfies DynamicLayout;

export type LayoutProps = InferLayoutPropsType<LayoutType>;
export type LayoutType = typeof Layout;
export type PageProps = InferPagePropsType<RouteType>;
export type RouteType = typeof Route;
