import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  description: text("description"),
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});
