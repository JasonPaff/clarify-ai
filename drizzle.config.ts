import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: './clarify-dev.db',
  },
  dialect: 'sqlite',
  out: './drizzle',
  schema: [
    './db/schema/projects.schema.ts',
    './db/schema/repositories.schema.ts',
    './db/schema/feature-requests.schema.ts',
  ],
});
