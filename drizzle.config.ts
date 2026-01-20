import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: './clarify-dev.db',
  },
  dialect: 'sqlite',
  out: './drizzle',
  schema: [
    './db/schema/feature-request-context-files.schema.ts',
    './db/schema/feature-request-repositories.schema.ts',
    './db/schema/feature-request-runs.schema.ts',
    './db/schema/feature-requests.schema.ts',
    './db/schema/projects.schema.ts',
    './db/schema/repositories.schema.ts',
    './db/schema/repository-overviews.schema.ts',
    './db/schema/step-configurations.schema.ts',
  ],
});
