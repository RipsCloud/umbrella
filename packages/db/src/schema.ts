import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const examples = sqliteTable("examples", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
