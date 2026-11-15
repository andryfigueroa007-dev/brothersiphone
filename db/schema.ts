import { pgTable, text, jsonb, integer } from 'drizzle-orm/pg-core';
export const catalogState = pgTable('catalog_state', {
  id: text().primaryKey(),
  products: jsonb().notNull(),
  revision: integer().notNull().default(1),
});
