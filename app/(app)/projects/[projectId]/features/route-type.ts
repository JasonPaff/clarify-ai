import { DynamicRoute, InferPagePropsType } from 'next-typesafe-url';
import { z } from 'zod';

/**
 * Status filter values for the feature request list.
 * Includes all workflow status values plus "all" for showing all statuses.
 */
export const featureStatusFilterValues = [
  'all',
  'clarifying',
  'completed',
  'describing',
  'draft',
  'failed',
  'planning',
  'researching',
] as const;

export type FeatureStatusFilter = (typeof featureStatusFilterValues)[number];

export const Route = {
  routeParams: z.object({
    projectId: z.number(),
  }),
  searchParams: z.object({
    search: z.string().optional(),
    status: z.enum(featureStatusFilterValues).optional(),
  }),
} satisfies DynamicRoute;

export type PageProps = InferPagePropsType<RouteType>;
export type RouteType = typeof Route;
